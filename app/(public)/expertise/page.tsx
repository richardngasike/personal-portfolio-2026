import type { Metadata } from 'next';
import type { IconType } from 'react-icons';
import { FiCloud, FiCode, FiDatabase, FiLayers, FiMonitor, FiShield, FiSmartphone, FiTool } from 'react-icons/fi';
import '@/styles/pages/expertise.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactCta } from '@/components/shared/ContactCta';
import { pageMetadata } from '@/lib/seo';
import { getSkillGroups } from '@/lib/queries/public';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Technical expertise: frontend, mobile, backend, cloud and design',
  description:
    'The languages, frameworks, platforms and design tools Richard Ngasike works with, grouped by engineering discipline.',
  path: '/expertise',
});

function categoryIcon(name: string): IconType {
  const text = name.toLowerCase();
  if (text.includes('front')) return FiCode;
  if (text.includes('mobile')) return FiSmartphone;
  if (text.includes('back')) return FiLayers;
  if (text.includes('data')) return FiDatabase;
  if (text.includes('cloud') || text.includes('infra')) return FiCloud;
  if (text.includes('secur')) return FiShield;
  if (text.includes('creative') || text.includes('design')) return FiMonitor;
  return FiTool;
}

export default async function ExpertisePage() {
  const groups = await getSkillGroups();

  return (
    <>
      <PageHeader
        path="/expertise"
        eyebrow="Technical expertise"
        title="A multidisciplinary skill set."
        lead="The tools and practices I use, grouped by discipline."
      />

      <section className="section section--flush-top">
        <div className="container">
          {groups.length > 0 ? (
            <div className="expertise">
              {groups.map((group) => {
                const Icon = categoryIcon(group.name);
                return (
                  <section key={group.id} className="expertise__card" aria-labelledby={`skills-${group.slug}`}>
                    <Icon className="expertise__icon" aria-hidden="true" />
                    <h2 id={`skills-${group.slug}`} className="expertise__title">
                      {group.name}
                    </h2>
                    {group.description ? <p className="expertise__description">{group.description}</p> : null}
                    <ul className="expertise__skills">
                      {group.skills.map((skill) => (
                        <li key={skill.id} title={skill.description || undefined}>
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">Skills have not been published yet.</p>
          )}
        </div>
      </section>

      <ContactCta />
    </>
  );
}
