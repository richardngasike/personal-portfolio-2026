import { ImageResponse } from 'next/og';
import { getProjectBySlug, getSettings } from '@/lib/queries/public';

export const alt = 'Project case study';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

// Sharing card for each project: its name, category and stack.
export default async function ProjectOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSettings()]);
  const title = project?.title ?? 'Project';
  const stack = project?.technologies.slice(0, 5).join('  /  ') ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#101317',
          color: '#f4f2ec',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: '#a4a7ad' }}>
          {project?.categoryName ?? 'Project'} by {settings.wordmark || 'Richard Ngasike'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: title.length > 22 ? 84 : 112, letterSpacing: -3, lineHeight: 1 }}>{title}</div>
          <div style={{ display: 'flex', width: 96, height: 4, marginTop: 36, background: '#c9a045' }} />
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#a4a7ad' }}>{stack}</div>
      </div>
    ),
    size,
  );
}
