import { FileUpload } from '../components/FileUpload';
import { useApi } from '../hooks/useApi';

export function Profile() {
  const { data, error, loading, setData } = useApi('/users/me/profile');

  const profile = data?.profile;

  // Both upload endpoints answer with a fresh presigned URL, so patch it in
  // rather than refetching the whole profile.
  function applyUpload(field) {
    return (result) =>
      setData((prev) => ({ profile: { ...prev.profile, [field]: result[field] } }));
  }

  return (
    <section className="page">
      <h1>My profile</h1>
      <p className="muted">Your resume and photo are private — links expire after an hour.</p>

      {loading && <p data-testid="loading">Loading your profile…</p>}
      {error && <p className="error">{error.message}</p>}

      {profile && (
        <>
          <div className="panel">
            <div className="row-between">
              <h2>{profile.name}</h2>
              <span className="muted">{profile.email}</span>
            </div>

            {profile.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt="Your profile"
                width="120"
                height="120"
                style={{ objectFit: 'cover', borderRadius: '50%' }}
                data-testid="profile-picture"
              />
            ) : (
              <p className="muted" data-testid="no-profile-picture">
                No profile picture yet.
              </p>
            )}

            {profile.resume_url ? (
              <p>
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="resume-link"
                >
                  View current resume
                </a>
              </p>
            ) : (
              <p className="muted" data-testid="no-resume">
                No resume uploaded yet.
              </p>
            )}
          </div>

          <div className="panel">
            <h2>Uploads</h2>
            <FileUpload
              label="Resume (PDF, max 5MB)"
              hint="Replaces whatever resume innovators can currently see."
              path="/uploads/resume"
              accept="application/pdf,.pdf"
              onUploaded={applyUpload('resume_url')}
              testId="upload-resume"
            />
            <FileUpload
              label="Profile picture (JPG or PNG, max 2MB)"
              path="/uploads/profile-picture"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onUploaded={applyUpload('profile_picture_url')}
              testId="upload-profile-picture"
            />
          </div>
        </>
      )}
    </section>
  );
}
