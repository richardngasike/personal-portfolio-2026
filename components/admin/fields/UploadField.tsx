'use client';

import { useRef, useState } from 'react';
import { FiExternalLink, FiFileText, FiRefreshCw, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';
import { getSignedFileUrl } from '@/lib/admin/actions';
import { BUCKETS, assetUrl, buildObjectPath, isStoragePath, validateFile, type BucketId } from '@/lib/storage';

interface UploadFieldProps {
  id: string;
  kind: 'image' | 'file';
  bucket: BucketId;
  folder: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onError: (message: string) => void;
}

// Uploads one file straight from the browser to Supabase Storage as the
// signed-in administrator. Storage policies and bucket limits enforce who may
// upload and what; the checks here only give faster feedback.
export function UploadField({ id, kind, bucket, folder, value, onChange, onError }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const rule = BUCKETS[bucket];

  async function onSelect(file: File | undefined) {
    if (!file) return;
    const problem = validateFile(bucket, file);
    if (problem) {
      onError(problem);
      return;
    }

    setUploading(true);
    if (kind === 'image') setLocalPreview(URL.createObjectURL(file));

    try {
      const path = buildObjectPath(folder, file.name);
      const { error } = await createClient()
        .storage.from(bucket)
        .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
      if (error) throw new Error(error.message);
      onChange(path);
    } catch (error) {
      setLocalPreview(null);
      onError(`Upload failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function openPrivateFile() {
    if (!value) return;
    if (!isStoragePath(value)) {
      window.open(value, '_blank', 'noopener');
      return;
    }
    const result = await getSignedFileUrl(bucket, value);
    if (result.ok && result.url) window.open(result.url, '_blank', 'noopener');
    else onError(result.message || 'The file could not be opened.');
  }

  const previewUrl = kind === 'image' ? localPreview || (rule.isPublic ? assetUrl(bucket, value) : null) : null;
  const fileName = value ? value.split('/').pop() : null;

  return (
    <div className="upload" data-busy={uploading}>
      {value || uploading ? (
        <div className="upload__current">
          {kind === 'image' ? (
            <div className="upload__preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previewUrl ? <img src={previewUrl} alt="Current upload" /> : null}
            </div>
          ) : (
            <div className="upload__file">
              <FiFileText aria-hidden="true" />
              <span>{fileName}</span>
            </div>
          )}
          <div className="upload__actions">
            {uploading ? (
              <p className="upload__status" role="status">
                Uploading...
              </p>
            ) : (
              <>
                {kind === 'file' ? (
                  <button type="button" className="abtn abtn--ghost abtn--small" onClick={openPrivateFile}>
                    <FiExternalLink aria-hidden="true" /> View
                  </button>
                ) : null}
                <button type="button" className="abtn abtn--ghost abtn--small" onClick={() => inputRef.current?.click()}>
                  <FiRefreshCw aria-hidden="true" /> Replace
                </button>
                <button
                  type="button"
                  className="abtn abtn--ghost abtn--small abtn--danger-text"
                  onClick={() => {
                    setLocalPreview(null);
                    onChange(null);
                  }}
                >
                  <FiTrash2 aria-hidden="true" /> Remove
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <button type="button" className="upload__drop" onClick={() => inputRef.current?.click()}>
          <FiUploadCloud aria-hidden="true" />
          <span>Choose {kind === 'image' ? 'an image' : 'a file'}</span>
          <small>{rule.label}</small>
        </button>
      )}

      <input
        ref={inputRef}
        id={id}
        className="visually-hidden"
        type="file"
        accept={rule.mimeTypes.join(',')}
        tabIndex={-1}
        onChange={(event) => onSelect(event.target.files?.[0])}
      />
    </div>
  );
}
