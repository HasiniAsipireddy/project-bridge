import path from 'node:path';

import { Router } from 'express';
import multer from 'multer';
import { flattenError, z } from 'zod';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { buildKey, getPresignedUrl, putObject } from '../lib/s3.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const MB = 1024 * 1024;

/**
 * What each endpoint accepts. `extensions` and `mimeTypes` are checked against
 * each other so a .pdf renamed from .exe, or an image sent with a PDF
 * content-type, is rejected before anything reaches S3.
 */
const UPLOAD_KINDS = {
  resume: {
    field: 'resume_key',
    urlField: 'resume_url',
    prefix: 'resumes',
    maxBytes: 5 * MB,
    maxLabel: '5MB',
    // extension -> the one MIME type it may arrive as.
    accepted: { '.pdf': ['application/pdf'] },
    // Leading bytes every accepted format must start with. The client controls
    // both the filename and the Content-Type header, so neither is evidence on
    // its own; the file's own signature is.
    signatures: [[0x25, 0x50, 0x44, 0x46]], // %PDF
    label: 'a PDF',
  },
  profilePicture: {
    field: 'profile_picture_key',
    urlField: 'profile_picture_url',
    prefix: 'profile-pictures',
    maxBytes: 2 * MB,
    maxLabel: '2MB',
    accepted: {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
    },
    signatures: [
      [0xff, 0xd8, 0xff], // JPEG
      [0x89, 0x50, 0x4e, 0x47], // PNG
    ],
    label: 'a JPG or PNG image',
  },
};

/** Mirrors validateBody's 400 shape, since multipart bodies bypass validateBody. */
function badRequest(res, message) {
  return res.status(400).json({ error: 'Validation failed', fields: { file: [message] } });
}

/**
 * The file metadata multer hands us, validated the same way every other input
 * is. Size is re-checked here as well as by multer's own limit: multer aborts
 * mid-stream, this catches anything that slipped through as a clean 400.
 */
function fileSchema(kind) {
  return z.object({
    originalname: z.string().min(1),
    mimetype: z.enum(Object.values(kind.accepted).flat(), {
      error: `File must be ${kind.label} (unexpected content type)`,
    }),
    size: z
      .number()
      .int()
      .positive('File is empty')
      .max(kind.maxBytes, `File must be ${kind.maxLabel} or smaller`),
    buffer: z.instanceof(Buffer),
  });
}

function startsWith(buffer, signature) {
  return signature.every((byte, index) => buffer[index] === byte);
}

/**
 * Runs multer for one upload kind and normalises its failures into 400s.
 * Without this, a file over the limit surfaces as an unhandled MulterError and
 * the generic error handler reports it as a 500.
 */
function receiveFile(kind) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: kind.maxBytes, files: 1 },
  }).single('file');

  return function fileReceiver(req, res, next) {
    upload(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return badRequest(res, `File must be ${kind.maxLabel} or smaller`);
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return badRequest(res, 'Send exactly one file in a "file" field');
        }
        return badRequest(res, err.message);
      }

      return next(err);
    });
  };
}

/**
 * Uploads to S3, then records the key on the caller's own row. `req.user.id` is
 * the only id involved, so there is no way to write another student's profile
 * through here.
 */
function handleUpload(kind) {
  return async function uploadHandler(req, res, next) {
    if (!req.file) {
      return badRequest(res, 'Send exactly one file in a "file" field');
    }

    const parsed = fileSchema(kind).safeParse(req.file);
    if (!parsed.success) {
      const { fieldErrors } = flattenError(parsed.error);
      return res.status(400).json({ error: 'Validation failed', fields: fieldErrors });
    }

    const { originalname, mimetype, size, buffer } = parsed.data;

    const extension = path.extname(originalname).toLowerCase();
    const allowedMimes = kind.accepted[extension];
    if (!allowedMimes) {
      return badRequest(res, `File must be ${kind.label} (unexpected file extension)`);
    }
    // Extension and content-type must agree — a .png announced as
    // application/pdf is a spoof attempt, not a naming slip.
    if (!allowedMimes.includes(mimetype)) {
      return badRequest(res, `File extension ${extension} does not match its content type`);
    }
    if (!kind.signatures.some((signature) => startsWith(buffer, signature))) {
      return badRequest(res, `File contents are not ${kind.label}`);
    }

    const key = buildKey(kind.prefix, req.user.id, extension);

    try {
      await putObject({ key, body: buffer, contentType: mimetype });
    } catch (err) {
      // The DB is untouched, so the profile still points at the previous
      // object (or at nothing) — never at a key that failed to upload.
      console.error('S3 upload failed', err);
      return res.status(500).json({ error: 'Upload to storage failed. Please try again.' });
    }

    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { [kind.field]: key },
      });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      return next(err);
    }

    // Hand back a presigned URL rather than the key: the bucket is private and
    // the client needs something it can actually render or link to.
    const url = await getPresignedUrl(key);

    return res.status(201).json({
      [kind.urlField]: url,
      key,
      filename: originalname,
      size,
      expires_in: env.s3UrlExpiresIn,
    });
  };
}

export const uploadsRouter = Router();

uploadsRouter.post(
  '/resume',
  requireAuth,
  requireRole('student'),
  receiveFile(UPLOAD_KINDS.resume),
  handleUpload(UPLOAD_KINDS.resume),
);

uploadsRouter.post(
  '/profile-picture',
  requireAuth,
  requireRole('student'),
  receiveFile(UPLOAD_KINDS.profilePicture),
  handleUpload(UPLOAD_KINDS.profilePicture),
);
