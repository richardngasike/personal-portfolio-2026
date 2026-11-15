import Image from 'next/image';
import Link from 'next/link';
import { formatLongDate } from '@/lib/utils/format';
import type { PostSummary } from '@/types/portfolio';

// Editorial blog layout. The newest post is a full-width feature; the rest
// flow in a varied rhythm of two-up rows, three-up rows and a wide
// image-beside-text row, so the page never reads as one repeating grid.
// Cover images fill their blocks here for the magazine look; the single post
// page shows each image in full, uncropped.

function Placeholder({ title }: { title: string }) {
  return (
    <span className="feed-ph" aria-hidden="true">
      <span>{title}</span>
    </span>
  );
}

function FeatureCard({ post }: { post: PostSummary }) {
  return (
    <article className="feature">
      <span className="feature__media">
        {post.coverUrl ? (
          <Image src={post.coverUrl} alt="" fill priority sizes="(max-width: 1000px) 100vw, 1000px" />
        ) : (
          <Placeholder title={post.title} />
        )}
      </span>
      <span className="feature__overlay" aria-hidden="true" />
      <div className="feature__content">
        <p className="feature__date">
          <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
        </p>
        <h2 className="feature__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        {post.excerpt ? <p className="feature__excerpt">{post.excerpt}</p> : null}
      </div>
    </article>
  );
}

function WideCard({ post }: { post: PostSummary }) {
  return (
    <article className="wide">
      <span className="wide__media">
        {post.coverUrl ? (
          <Image src={post.coverUrl} alt="" fill sizes="(max-width: 820px) 100vw, 560px" />
        ) : (
          <Placeholder title={post.title} />
        )}
      </span>
      <div className="wide__body">
        <p className="feed-card__date">
          <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
        </p>
        <h2 className="wide__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        {post.excerpt ? <p className="feed-card__excerpt">{post.excerpt}</p> : null}
      </div>
    </article>
  );
}

function VerticalCard({ post, compact }: { post: PostSummary; compact?: boolean }) {
  return (
    <article className="feed-card">
      <Link href={`/blog/${post.slug}`} className="feed-card__media" aria-hidden="true" tabIndex={-1}>
        {post.coverUrl ? (
          <Image src={post.coverUrl} alt="" fill sizes={compact ? '(max-width: 820px) 100vw, 300px' : '(max-width: 820px) 100vw, 440px'} />
        ) : (
          <Placeholder title={post.title} />
        )}
      </Link>
      <div className="feed-card__body">
        <p className="feed-card__date">
          <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
        </p>
        <h2 className="feed-card__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        {!compact && post.excerpt ? <p className="feed-card__excerpt">{post.excerpt}</p> : null}
      </div>
    </article>
  );
}

export function BlogFeed({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;
  const [hero, ...rest] = posts;

  // Break the remaining posts into full rows with a repeating rhythm.
  const pattern = [2, 3, 1];
  const rows: PostSummary[][] = [];
  let index = 0;
  let step = 0;
  while (index < rest.length) {
    const size = pattern[step % pattern.length];
    rows.push(rest.slice(index, index + size));
    index += size;
    step += 1;
  }

  return (
    <div className="feed">
      <FeatureCard post={hero} />
      {rows.map((row, rowIndex) => {
        if (row.length === 1) {
          return (
            <div key={rowIndex} className="feed-row feed-row--wide">
              <WideCard post={row[0]} />
            </div>
          );
        }
        const columns = row.length === 2 ? 'feed-row--2' : 'feed-row--3';
        return (
          <div key={rowIndex} className={`feed-row ${columns}`}>
            {row.map((post) => (
              <VerticalCard key={post.id} post={post} compact={row.length === 3} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
