import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  aws: {
    region: required('AWS_REGION'),
    bucket: required('AWS_S3_BUCKET'),
    accessKeyId: required('AWS_ACCESS_KEY_ID'),
    secretAccessKey: required('AWS_SECRET_ACCESS_KEY'),
  },
  ses: {
    // Must be an address (or domain) verified in SES, otherwise every send is
    // rejected. In sandbox mode the *recipient* must be verified too.
    fromEmail: required('AWS_SES_FROM_EMAIL'),
  },
  // Lifetime of the presigned GET URLs handed to the client, in seconds.
  s3UrlExpiresIn: Number(process.env.S3_URL_EXPIRES_IN ?? 3600),
};

export const isProduction = env.nodeEnv === 'production';
