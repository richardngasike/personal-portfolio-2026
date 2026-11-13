'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowDown, FiArrowUp, FiSave, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import {
  addProjectImages,
  deleteProjectImage,
  reorderProjectImages,
  updateProjectImage,
} from '@/lib/admin/actions';
import { BUCKETS, assetUrl } from '@/lib/storage';
import type { ProjectImageRow } from '@/types/database';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';
import { UploadProgress } from './UploadProgress';
import { useBatchUpload } from './useBatchUpload';

interface ProjectImagesManagerProps {
  projectId: string;
  images: ProjectImageRow[];
}

export function ProjectImagesManager({ projectId, images: initialImages }: ProjectImagesManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [syncedFrom, setSyncedFrom] = useState(initialImages);
  const [toDelete, setToDelete] = useState<ProjectImageRow | null>(null);
  const [pending, startTransition] = useTransition();
  const { upload, progress } = useBatchUpload('project-images', `screenshots/${projectId}`);

  // Adopt the server's list after a refresh (for example after an upload).
  if (syncedFrom !== initialImages) {
    setSyncedFrom(initialImages);
    setImages(initialImages);
  }

  async function onSelect(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (files.length === 0) return;

    const { uploaded, problems } = await upload(files);
    problems.forEach((problem) => toast.error(problem));
    if (uploaded.length === 0) return;

    const result = await addProjectImages(projectId, uploaded.map((file) => file.path));
    if (result.ok) {
      toast.success(result.message || 'Screenshots added.');
      router.refresh();
    } else {
      toast.error(result.message || 'The screenshots could not be saved.');
    }
  }

  function setField(id: string, field: 'caption' | 'alt_text', value: string) {
    setImages((current) => current.map((image) => (image.id === id ? { ...image, [field]: value } : image)));
  }

  function save(image: ProjectImageRow) {
    startTransition(async () => {
      const result = await updateProjectImage(image.id, { caption: image.caption, alt_text: image.alt_text });
      if (result.ok) toast.success(result.message || 'Saved.');
      else toast.error(result.message || 'The screenshot could not be saved.');
    });
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const previous = images;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    startTransition(async () => {
      const result = await reorderProjectImages(projectId, next.map((image) => image.id));
      if (!result.ok) {
        setImages(previous);
        toast.error(result.message || 'The order could not be saved.');
      }
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    startTransition(async () => {
      const result = await deleteProjectImage(target.id);
      setToDelete(null);
      if (result.ok) {
        setImages((current) => current.filter((image) => image.id !== target.id));
        toast.success(result.message || 'Deleted.');
      } else {
        toast.error(result.message || 'The screenshot could not be deleted.');
      }
    });
  }

  return (
    <section className="panel">
      <header className="panel__header panel__header--split">
        <div>
          <h2>Screenshots</h2>
          <p>Shown in the case study in this order. {BUCKETS['project-images'].label}.</p>
        </div>
        <button type="button" className="abtn abtn--primary" onClick={() => inputRef.current?.click()} disabled={Boolean(progress)}>
          <FiUploadCloud aria-hidden="true" /> Upload screenshots
        </button>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          multiple
          accept={BUCKETS['project-images'].mimeTypes.join(',')}
          tabIndex={-1}
          onChange={(event) => onSelect(event.target.files)}
        />
      </header>

      <div className="panel__body">
        <UploadProgress progress={progress} />

        {images.length === 0 ? (
          <p className="empty empty--inline">No screenshots yet. You can select several images at once.</p>
        ) : (
          <ul className="shots">
            {images.map((image, index) => (
              <li key={image.id} className="shot">
                <div className="shot__preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetUrl('project-images', image.image_path) ?? ''} alt="" loading="lazy" />
                </div>
                <div className="shot__fields">
                  <label>
                    <span>Caption</span>
                    <input type="text" value={image.caption} maxLength={300} onChange={(event) => setField(image.id, 'caption', event.target.value)} />
                  </label>
                  <label>
                    <span>Alternative text</span>
                    <input type="text" value={image.alt_text} maxLength={300} onChange={(event) => setField(image.id, 'alt_text', event.target.value)} />
                  </label>
                </div>
                <div className="shot__actions">
                  <button type="button" className="icon-button" onClick={() => move(index, -1)} disabled={index === 0 || pending} aria-label="Move up">
                    <FiArrowUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1 || pending}
                    aria-label="Move down"
                  >
                    <FiArrowDown aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-button" onClick={() => save(image)} disabled={pending} aria-label="Save caption" title="Save caption">
                    <FiSave aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-button icon-button--danger"
                    onClick={() => setToDelete(image)}
                    aria-label="Delete screenshot"
                    title="Delete"
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this screenshot?"
        message="The image will be permanently removed from the project and from storage."
        busy={pending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
