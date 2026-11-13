'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildObjectPath, validateFile, type BucketId } from '@/lib/storage';

export interface UploadedFile {
  path: string;
  name: string;
  width: number | null;
  height: number | null;
}

export interface BatchProgress {
  total: number;
  done: number;
  current: string;
}

function readDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth || null, height: image.naturalHeight || null });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

// Uploads several files one after another and reports progress per file.
export function useBatchUpload(bucket: BucketId, folder: string) {
  const [progress, setProgress] = useState<BatchProgress | null>(null);

  const upload = useCallback(
    async (files: File[]): Promise<{ uploaded: UploadedFile[]; problems: string[] }> => {
      const problems: string[] = [];
      const accepted = files.filter((file) => {
        const problem = validateFile(bucket, file);
        if (problem) problems.push(problem);
        return !problem;
      });

      const uploaded: UploadedFile[] = [];
      const storage = createClient().storage.from(bucket);
      setProgress({ total: accepted.length, done: 0, current: accepted[0]?.name ?? '' });

      for (const [index, file] of accepted.entries()) {
        setProgress({ total: accepted.length, done: index, current: file.name });
        const path = buildObjectPath(folder, file.name);
        const { error } = await storage.upload(path, file, {
          contentType: file.type,
          cacheControl: '31536000',
          upsert: false,
        });
        if (error) {
          problems.push(`${file.name}: ${error.message}`);
          continue;
        }
        const dimensions = await readDimensions(file);
        uploaded.push({ path, name: file.name, ...dimensions });
      }

      setProgress(null);
      return { uploaded, problems };
    },
    [bucket, folder],
  );

  return { upload, progress };
}
