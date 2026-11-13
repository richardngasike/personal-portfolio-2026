'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { createGalleryImages } from '@/lib/admin/actions';
import { BUCKETS, validateFile } from '@/lib/storage';
import { useToast } from './Toast';
import { UploadProgress } from './UploadProgress';
import { useBatchUpload } from './useBatchUpload';

interface Selection {
  file: File;
  preview: string;
  title: string;
}

interface GalleryUploaderProps {
  categories: Array<{ value: string; label: string }>;
}

function titleFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Select several images, preview them, set titles, then upload them together.
export function GalleryUploader({ categories }: GalleryUploaderProps) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<Selection[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [publish, setPublish] = useState(false);
  const [saving, setSaving] = useState(false);
  const { upload, progress } = useBatchUpload('gallery-images', 'work');

  function onSelect(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = '';
    const accepted: Selection[] = [];
    for (const file of files) {
      const problem = validateFile('gallery-images', file);
      if (problem) toast.error(problem);
      else accepted.push({ file, preview: URL.createObjectURL(file), title: titleFromName(file.name) });
    }
    setSelection((current) => [...current, ...accepted].slice(0, 40));
  }

  function remove(index: number) {
    setSelection((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });
  }

  async function submit() {
    if (selection.length === 0 || saving) return;
    setSaving(true);
    try {
      const { uploaded, problems } = await upload(selection.map((item) => item.file));
      problems.forEach((problem) => toast.error(problem));
      if (uploaded.length === 0) return;

      const titles = new Map(selection.map((item) => [item.file.name, item.title]));
      const result = await createGalleryImages(
        uploaded.map((file) => ({
          image_path: file.path,
          title: titles.get(file.name) ?? '',
          width: file.width,
          height: file.height,
        })),
        { categoryId: categoryId || null, published: publish },
      );

      if (result.ok) {
        toast.success(result.message || 'Images added.');
        selection.forEach((item) => URL.revokeObjectURL(item.preview));
        setSelection([]);
        router.push('/admin/gallery');
        router.refresh();
      } else {
        toast.error(result.message || 'The images could not be saved.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Upload images</h2>
        <p>Select one or several images. {BUCKETS['gallery-images'].label} each. Captions and descriptions can be added afterwards.</p>
      </header>

      <div className="panel__body">
        <button type="button" className="upload__drop" onClick={() => inputRef.current?.click()} disabled={saving}>
          <FiUploadCloud aria-hidden="true" />
          <span>Choose images</span>
          <small>Up to 40 at a time</small>
        </button>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          multiple
          accept={BUCKETS['gallery-images'].mimeTypes.join(',')}
          tabIndex={-1}
          onChange={(event) => onSelect(event.target.files)}
        />

        {selection.length > 0 ? (
          <>
            <ul className="uploader-grid">
              {selection.map((item, index) => (
                <li key={item.preview} className="uploader-item">
                  <div className="uploader-item__preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt="" />
                  </div>
                  <label>
                    <span className="visually-hidden">Title for {item.file.name}</span>
                    <input
                      type="text"
                      value={item.title}
                      maxLength={200}
                      placeholder="Title"
                      onChange={(event) =>
                        setSelection((current) => current.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-button icon-button--danger"
                    onClick={() => remove(index)}
                    disabled={saving}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="field-grid">
              <div className="field field--half">
                <label className="field__label" htmlFor="gallery-upload-category">
                  Category for these images
                </label>
                <select id="gallery-upload-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field--half">
                <label className="check check--offset">
                  <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} />
                  <span>Publish immediately</span>
                </label>
              </div>
            </div>

            <UploadProgress progress={progress} />

            <div className="record-form__actions">
              <button type="button" className="abtn abtn--primary" onClick={submit} disabled={saving}>
                {saving ? 'Uploading...' : `Upload ${selection.length} ${selection.length === 1 ? 'image' : 'images'}`}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
