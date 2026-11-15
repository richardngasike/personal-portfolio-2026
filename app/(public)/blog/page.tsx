import type { Metadata } from 'next';
import { BlogFeed } from '@/components/blog/BlogFeed';
import '@/styles/pages/blog.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactCta } from '@/components/shared/ContactCta';
import { JsonLd } from '@/components/shared/JsonLd';
import { absoluteUrl, pageMetadata } from '@/lib/seo';
import { formatLongDate } from '@/lib/utils/format';
import { getPosts } from '@/lib/queries/public';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Blog',
  description: 'News, updates and writing from Richard Ngasike: projects, events, design work and thoughts on building software.',
  path: '/blog',
});

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="News, updates and writing."
        lead="What I am working on, events I attend, and notes on building software and design."
        path="/blog"
      />

      <section className="section section--flush-top">
        <div className="container">
          {posts.length > 0 ? (
            <BlogFeed posts={posts} />
          ) : (
            <p className="empty-state">Posts will appear here once they are published.</p>
          )}
        </div>
      </section>

      {posts.length > 0 ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Richard Ngasike - Blog',
            url: absoluteUrl('/blog'),
            blogPost: posts.slice(0, 20).map((post) => ({
              '@type': 'BlogPosting',
              headline: post.title,
              url: absoluteUrl(`/blog/${post.slug}`),
              datePublished: post.publishedAt,
              ...(post.excerpt ? { description: post.excerpt } : {}),
            })),
          }}
        />
      ) : null}

      <ContactCta />
    </>
  );
}
