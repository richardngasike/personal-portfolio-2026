import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import '@/styles/pages/blog.css';
import { ContactCta } from '@/components/shared/ContactCta';
import { JsonLd } from '@/components/shared/JsonLd';
import { SITE_URL } from '@/lib/env';
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { formatLongDate, paragraphs } from '@/lib/utils/format';
import { getPostBySlug, getPosts, getProfile } from '@/lib/queries/public';

export const revalidate = 300;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return pageMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || post.title,
    path: `/blog/${post.slug}`,
    image: post.coverUrl,
    type: 'article',
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [profile, allPosts] = await Promise.all([getProfile(), getPosts()]);
  const body = paragraphs(post.body);
  const more = allPosts.filter((item) => item.slug !== post.slug).slice(0, 2);

  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.coverUrl ? { image: absoluteUrl(post.coverUrl) } : {}),
    ...(post.tags.length > 0 ? { keywords: post.tags.join(', ') } : {}),
    author: { '@type': 'Person', name: profile.full_name, url: SITE_URL },
    publisher: { '@type': 'Person', name: profile.full_name, url: SITE_URL },
  };

  return (
    <>
      <article className="post">
        <header className="post__header">
          <div className="container container--narrow">
            <nav aria-label="Breadcrumb">
              <ol className="breadcrumbs post__crumbs">
                <li>
                  <Link href="/blog">Blog</Link>
                </li>
              </ol>
            </nav>
            <p className="post__date">
              <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
            </p>
            <h1 className="heading-1 post__title">{post.title}</h1>
            {post.excerpt ? <p className="lead post__lead">{post.excerpt}</p> : null}
          </div>
        </header>

        {post.coverUrl ? (
          <figure className="post__cover">
            <div className="container container--narrow">
              <div className="post__cover-frame">
                <Image src={post.coverUrl} alt={post.title} fill sizes="(max-width: 760px) 100vw, 720px" priority />
              </div>
            </div>
          </figure>
        ) : null}

        {body.length > 0 ? (
          <div className="container container--narrow">
            <div className="prose post__body">
              {body.map((part, index) => (
                <p key={index}>{part}</p>
              ))}
            </div>
          </div>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="container container--narrow">
            <ul className="tag-list post__tags" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag} className="tag">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="container container--narrow">
          <Link href="/blog" className="arrow-link post__back">
            <FiArrowLeft aria-hidden="true" /> All posts
          </Link>
        </div>
      </article>

      {more.length > 0 ? (
        <section className="section" aria-labelledby="more-posts">
          <div className="container">
            <div className="section__header">
              <h2 id="more-posts" className="section__title">
                More from the blog
              </h2>
            </div>
            <ul className="post-grid">
              {more.map((item) => (
                <li key={item.id}>
                  <article className="post-card">
                    <Link href={`/blog/${item.slug}`} className="post-card__media" aria-hidden="true" tabIndex={-1}>
                      {item.coverUrl ? (
                        <Image src={item.coverUrl} alt={item.title} fill sizes="(max-width: 640px) 100vw, 360px" />
                      ) : (
                        <span className="post-card__placeholder">{item.title}</span>
                      )}
                    </Link>
                    <div className="post-card__body">
                      <p className="post-card__date">
                        <time dateTime={item.publishedAt}>{formatLongDate(item.publishedAt)}</time>
                      </p>
                      <h3 className="post-card__title">
                        <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                      </h3>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <ContactCta />
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Blog', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }])} />
    </>
  );
}
