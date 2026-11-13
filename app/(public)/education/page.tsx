import type { Metadata } from 'next';
import '@/styles/pages/education.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactCta } from '@/components/shared/ContactCta';
import { pageMetadata } from '@/lib/seo';
import { formatDateRange } from '@/lib/utils/format';
import { getEducation, getHomepage } from '@/lib/queries/public';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Education and Professional Development',
  description: 'Formal qualifications and continuing professional development of Richard Ngasike.',
  path: '/education',
});

export default async function EducationPage() {
  const [records, home] = await Promise.all([getEducation(), getHomepage()]);
  const formal = records.filter((record) => record.kind === 'formal');
  const learning = records.filter((record) => record.kind === 'professional_learning');

  return (
    <>
      <PageHeader
        eyebrow="Education and interests"
        title="Education and Professional Development"
        lead="My formal qualification, and the areas I am studying on my own."
      />

      <section className="section section--white" aria-labelledby="formal-heading">
        <div className="container">
          <div className="section__header">
            <p className="eyebrow">Formal education</p>
            <h2 id="formal-heading" className="heading-1">
              Qualifications
            </h2>
          </div>

          {formal.length > 0 ? (
            <ul className="qualifications">
              {formal.map((record) => {
                const dates = formatDateRange({
                  start: record.start_date,
                  end: record.end_date,
                  display: record.date_display,
                });
                return (
                  <li key={record.id} className="qualification">
                    <div className="qualification__aside">
                      {dates ? <p className="qualification__dates">{dates}</p> : null}
                      {record.exam_series ? <p className="meta">Examination series: {record.exam_series}</p> : null}
                    </div>
                    <div className="qualification__body">
                      <h3 className="heading-2">{record.qualification}</h3>
                      {record.institution ? <p className="qualification__institution">{record.institution}</p> : null}
                      <dl className="qualification__facts">
                        {record.field_of_study ? (
                          <div>
                            <dt>Field of study</dt>
                            <dd>{record.field_of_study}</dd>
                          </div>
                        ) : null}
                        {record.awarding_body ? (
                          <div>
                            <dt>Examination body</dt>
                            <dd>{record.awarding_body}</dd>
                          </div>
                        ) : null}
                      </dl>
                      {record.description ? <p className="prose">{record.description}</p> : null}
                      {record.coursework.length > 0 ? (
                        <div>
                          <h4 className="experience__subheading">Relevant coursework</h4>
                          <ul className="tag-list">
                            {record.coursework.map((course) => (
                              <li key={course} className="tag">
                                {course}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-state">Qualifications have not been published yet.</p>
          )}
        </div>
      </section>

      {learning.length > 0 ? (
        <section className="section" aria-labelledby="learning-heading">
          <div className="container learning">
            <div>
              <p className="eyebrow">Self-directed</p>
              <h2 id="learning-heading" className="heading-1">
                Professional learning
              </h2>
              <p className="lead">
                These are areas I am studying and practising on my own. They are not formal qualifications.
              </p>
            </div>
            <ul className="learning__list">
              {learning.map((record) => (
                <li key={record.id}>
                  <span className="learning__name">{record.qualification}</span>
                  {record.description ? <span className="meta">{record.description}</span> : null}
                  {record.institution ? <span className="meta">{record.institution}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <ContactCta heading={home.contact_heading || 'Get in touch'} text={home.contact_invitation} />
    </>
  );
}
