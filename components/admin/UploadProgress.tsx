import type { BatchProgress } from './useBatchUpload';

export function UploadProgress({ progress }: { progress: BatchProgress | null }) {
  if (!progress || progress.total === 0) return null;
  const percent = Math.round((progress.done / progress.total) * 100);
  return (
    <div className="progress" role="status" aria-live="polite">
      <p>
        Uploading {progress.done + 1} of {progress.total}: {progress.current}
      </p>
      <div className="progress__track">
        <div className="progress__bar" style={{ width: `${Math.max(percent, 4)}%` }} />
      </div>
    </div>
  );
}
