import { ImageResponse } from 'next/og';
import { getPostBySlug, getSettings } from '@/lib/queries/public';
import { formatLongDate } from '@/lib/utils/format';

export const alt = 'Blog post';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function PostOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSettings()]);
  const title = post?.title ?? 'Blog';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: '#101317', color: '#f4f2ec' }}>
        <div style={{ display: 'flex', fontSize: 26, color: '#a4a7ad' }}>
          {settings.wordmark || 'Richard Ngasike'} - Blog{post ? `  /  ${formatLongDate(post.publishedAt)}` : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: title.length > 40 ? 60 : 80, letterSpacing: -2, lineHeight: 1.05 }}>{title}</div>
          <div style={{ display: 'flex', width: 96, height: 4, marginTop: 32, background: '#c9a045' }} />
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#a4a7ad' }}>{post?.excerpt?.slice(0, 90) ?? ''}</div>
      </div>
    ),
    size,
  );
}
