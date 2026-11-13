-- Seed content for richardngasike.co.ke
-- Every statement is idempotent: running the file twice does not duplicate rows.
--
-- Sources: the existing website, Richard's CV, and the UNAIDS contract and
-- interim report. Records that could not be confirmed from those sources are
-- inserted with published = false so they stay off the public site until
-- they are reviewed in the admin dashboard.

-- Singletons -------------------------------------------------------------------

insert into public.website_settings
  (id, site_title, meta_description, wordmark, footer_text, copyright_holder, copyright_start_year, seo_keywords)
values (
  true,
  'Richard Ngasike',
  'Richard Ngasike is a software engineer and designer in Nairobi, Kenya. He builds web and mobile applications with Next.js, Flutter and Django, and designs publications and brand identities.',
  'Richard Ngasike',
  'Software engineering, mobile development and design from Nairobi, Kenya.',
  'Richard Ngasike',
  2025,
  array['Richard Ngasike', 'software engineer Nairobi', 'full-stack developer Kenya', 'Flutter developer Kenya', 'Next.js developer Nairobi', 'Django developer Kenya', 'graphic designer Nairobi', 'mobile app developer Kenya']
)
on conflict (id) do nothing;

insert into public.profiles
  (id, full_name, headline, short_intro, biography, philosophy, journey, interests,
   photo_path, location, email, phone, github_url, linkedin_url)
values (
  true,
  'Richard Ngasike',
  'Software engineer and designer',
  'I build web and mobile applications and design the publications, figures and brand identities that go with them. I work from Nairobi, Kenya.',
  E'I trained in Information and Communication Technology and have spent most of my working life somewhere between code and design.\n\nMy first paid work with computers was digitising birth certificate records at the County Registrar''s office in Samburu County. It was careful, repetitive work, and it taught me early that a system is only as good as the data people put into it. After that I taught computer literacy at Butterfly Techies, taking learners from operating a computer for the first time to building their first web pages in HTML, CSS and JavaScript.\n\nAlongside teaching I started building software for clients. On the web I work mainly with Next.js, React and TypeScript on the front end, and Django or Node.js with PostgreSQL behind it. On mobile I build with Flutter and Dart for Android and iOS. I prefer to own a product from the database schema through to deployment, so I am comfortable on a Linux server as well as in a design file.\n\nDesign has always run in parallel. At Extravis Solutions Africa I designed logos, product labels, packaging, catalogues and campaign graphics for print and digital. That experience is why I still care about typography, spacing and print-ready files when I am writing an interface.\n\nSince late 2025 I have worked with UNAIDS, first as an intern and then as a consultant developer and graphics designer. That work brought the two halves together: laying out slide decks and publication figures on one day, and writing Python scripts for data extraction or building the interface for a health tax simulation model on the next.\n\nI am currently spending my study time on cloud infrastructure, application security and the infrastructure side of AI and machine learning.',
  E'I start with the problem and the people who have it, not with the technology. Most of what I build is used by people on modest phones and unreliable connections, so I aim for software that is clear, fast and difficult to misuse.\n\nI would rather ship something small that is finished than something large that is almost working. I write things down, I check my work against the source, and I do not publish a number I cannot trace.',
  '[
    {"period": "2019", "title": "Records digitisation, Samburu County", "description": "Digitised civil registration records at the County Registrar''s office. My first professional work with structured data."},
    {"period": "2021 - 2022", "title": "Teaching computer literacy", "description": "Taught computer fundamentals and introductory web development at Butterfly Techies."},
    {"period": "2024 - 2025", "title": "Graphic design in industry", "description": "Designed brand, packaging and marketing material at Extravis Solutions Africa while completing a Diploma in ICT."},
    {"period": "2025 - 2026", "title": "UNAIDS internship", "description": "Joined UNAIDS as an intern and coordinated communication among interns across countries."},
    {"period": "2026", "title": "UNAIDS consultancy", "description": "Engaged as a developer and graphics designer: publication design, data work and health tax model interfaces."}
  ]'::jsonb,
  array['Cloud infrastructure', 'Application security', 'AI and ML infrastructure', 'Software architecture', 'Information design'],
  '/images/richard-ngasike.png',
  'Nairobi, Kenya',
  'richardmax254@gmail.com',
  '+254 718 959 781',
  'https://github.com/richardngasike',
  'https://www.linkedin.com/in/richard-ngasike-6247b5232/'
)
on conflict (id) do nothing;

insert into public.homepage_content
  (id, professional_title, hero_heading, hero_description, disciplines, hero_image_path,
   primary_button_text, primary_button_link, secondary_button_text, secondary_button_link,
   about_heading, about_intro, contact_heading, contact_invitation)
values (
  true,
  'Software Engineer · Mobile Developer · Designer',
  'Building digital products through engineering, technology and design.',
  'I''m Richard Ngasike, a software engineer and creative technology professional focused on building practical digital solutions, scalable applications and meaningful digital experiences.',
  array['Software Engineering', 'Mobile Development', 'Technology Infrastructure', 'Creative Design'],
  '/images/richard-ngasike.png',
  'Explore My Work', '/projects',
  'Download CV', '/api/cv',
  'Engineering and design, practised together',
  'I work across the whole product: database and API design, web and mobile interfaces, deployment, and the visual identity around them. My background covers records digitisation in county government, digital skills training, commercial graphic design and, most recently, development and publication design work with UNAIDS.',
  'Have a project in mind?',
  'I take on web and mobile development, backend work and design projects. Tell me what you are trying to build and I will reply by email.'
)
on conflict (id) do nothing;

-- Social links -----------------------------------------------------------------

insert into public.social_links (platform, label, url, sort_order, published)
select v.platform, v.label, v.url, v.sort_order, true
from (values
  ('github',   'GitHub',   'https://github.com/richardngasike', 1),
  ('linkedin', 'LinkedIn', 'https://www.linkedin.com/in/richard-ngasike-6247b5232/', 2),
  ('x',        'X',        'https://x.com/sudopacmansyu', 3)
) as v(platform, label, url, sort_order)
where not exists (select 1 from public.social_links);

-- Experience -------------------------------------------------------------------

insert into public.experiences
  (organisation, department, job_title, engagement_type, location, start_date, end_date, is_current,
   date_display, overview, responsibilities, contributions, deliverables, technologies, sort_order, published)
select * from (values
  (
    'UNAIDS',
    'Sustainability Team, Equitable Finance Practice',
    'Developer and Graphics Designer',
    'Consultancy',
    'Nairobi, Kenya',
    date '2026-06-03', date '2026-12-31', true,
    'June 2026 - December 2026',
    'I am engaged as a consultant developer and graphics designer. The assignment covers the layout and design of integration policy briefs and case studies, and it has grown to include data work and the interface for a health tax simulation model.',
    array[
      'Design and lay out technical slide presentations, policy briefs and infographics on HIV integration.',
      'Prepare publication figures to journal specifications as editable vector artwork.',
      'Write Python scripts that retrieve, clean and consolidate country-level data from public international databases into a master workbook.',
      'Build the user interface and computational backend for health tax simulation models.',
      'Document methods, data sources and limitations in technical notes and progress reports.'
    ],
    array[
      'Recreated and refined six figures for a team publication in Adobe Illustrator, working from the source workbook and the journal''s figure guidelines.',
      'Automated data extraction and matching by country and year for a debt displacement analysis covering 134 countries from 2000 to 2024.',
      'Implemented two health tax models as a web application with a Next.js interface and a Python computation backend.',
      'Developed a conceptual framework infographic through several rounds of review.'
    ],
    array[
      'Slide deck: Integrating HIV into health systems',
      'Slide deck: Operationalising HIV integration',
      'Conceptual framework infographic',
      'Six high-resolution publication figures',
      'Data extraction, cleaning and consolidation for the debt displacement effect analysis',
      'Health tax simulation model interface and computation (two models)'
    ],
    array['Next.js', 'Python', 'Adobe Illustrator', 'Microsoft PowerPoint', 'Microsoft Excel'],
    1, true
  ),
  (
    'UNAIDS',
    'Sustainability Team, Equitable Finance Practice',
    'Intern',
    'Internship',
    '',
    date '2025-11-01', date '2026-04-30', false,
    'November 2025 - April 2026',
    'I joined UNAIDS as an intern. During the internship I also served as coordinator for the organisation''s interns across countries.',
    array[
      'Coordinated communication and engagement among interns working in different countries.',
      'Acted as the liaison between the Staff Development Team and the intern group.',
      'Supported knowledge transfer and day-to-day coordination between interns and staff.'
    ],
    array[]::text[],
    array[]::text[],
    array[]::text[],
    2, true
  ),
  (
    'Extravis Solutions Africa',
    '',
    'Graphic Designer',
    'Full-time',
    '',
    date '2024-11-01', date '2025-11-30', false,
    'November 2024 - November 2025',
    'I designed brand and marketing material for a supplier of sewing and textile products, for both print and digital channels.',
    array[
      'Designed logos, product labels, packaging and marketing materials for sewing and textile supplies.',
      'Created promotional graphics for social media, print and advertising campaigns.',
      'Developed product catalogues and brochures to support sales and branding.',
      'Kept the brand consistent across digital and print platforms.',
      'Prepared print-ready artwork and coordinated with production vendors.'
    ],
    array[]::text[],
    array['Logos and product labels', 'Packaging artwork', 'Product catalogues and brochures', 'Social media and campaign graphics'],
    array['Adobe Illustrator', 'Adobe Photoshop', 'Canva'],
    3, true
  ),
  (
    'Butterfly Techies',
    '',
    'Computer Literacy Instructor',
    '',
    '',
    date '2021-05-01', date '2022-02-28', false,
    'May 2021 - February 2022',
    'I taught computer literacy and introductory web development to learners with a wide range of prior experience.',
    array[
      'Taught computer fundamentals, including operating systems, internet use and Microsoft Office applications.',
      'Introduced students to basic web development with HTML, CSS and JavaScript.',
      'Guided learners in building simple responsive web pages and practical mini-projects.',
      'Ran hands-on sessions to strengthen problem-solving and digital literacy.',
      'Assessed student progress and mentored learners on further study and careers in technology.'
    ],
    array[]::text[],
    array[]::text[],
    array['HTML', 'CSS', 'JavaScript', 'Microsoft Office'],
    4, true
  ),
  (
    'County Registrar Office - Samburu County',
    'Civil Registration',
    'Data Entry Clerk',
    '',
    'Samburu County, Kenya',
    null::date, null::date, false,
    '2019',
    'I worked on the digitisation of birth certificate records, converting physical registers into structured electronic records.',
    array[
      'Digitised birth certificate records by converting physical documentation into structured database entries.',
      'Entered high-volume demographic data accurately and in line with data protection standards.',
      'Verified and validated records for consistency and completeness.',
      'Cross-checked physical files against digital records to maintain data integrity.',
      'Supported database organisation so that records were easier for the office to retrieve.'
    ],
    array[]::text[],
    array[]::text[],
    array[]::text[],
    5, true
  ),
  (
    'Independent',
    '',
    'Freelance Developer',
    'Freelance',
    'Nairobi, Kenya',
    null::date, null::date, true,
    '2020 - Present',
    'Web and mobile development for clients in Kenya and abroad.',
    array[]::text[],
    array[]::text[],
    array[]::text[],
    array[]::text[],
    6, false
  )
) as v
where not exists (select 1 from public.experiences);

-- Education --------------------------------------------------------------------

insert into public.education
  (kind, institution, qualification, field_of_study, awarding_body, exam_series,
   start_date, end_date, date_display, description, coursework, sort_order, published)
select * from (values
  (
    'formal', 'St. John''s Training College, Maralal',
    'Diploma in Information and Communication Technology',
    'Information and Communication Technology',
    'Kenya National Examinations Council (KNEC)',
    'March 2026',
    date '2024-01-01', date '2025-11-30', 'January 2024 - November 2025',
    'A KNEC-examined diploma covering the foundations of computing, programming, databases, networking and systems.',
    array[]::text[], 1, true
  ),
  (
    'formal', 'Mount Kenya University',
    'Bachelor of Science in Information and Communication Technology',
    'Information and Communication Technology', '', '',
    date '2019-09-01', date '2023-11-22', '2019 - 2023',
    '', array[]::text[], 2, false
  ),
  (
    'formal', 'Kenyatta University',
    'KIEP-SKIES Rapid Tech Skills Program in Software Engineering',
    'Software Engineering', '', '',
    date '2024-03-01', date '2024-05-28', 'March 2024 - May 2024',
    '', array[]::text[], 3, false
  ),
  (
    'formal', 'Power Learn Project',
    'Artificial Intelligence',
    'Artificial Intelligence', '', '',
    null::date, null::date, '2026 - Present',
    '', array[]::text[], 4, false
  ),
  ('professional_learning', '', 'Python programming', '', '', '', null::date, null::date, '', '', array[]::text[], 1, true),
  ('professional_learning', '', 'Django development', '', '', '', null::date, null::date, '', '', array[]::text[], 2, true),
  ('professional_learning', '', 'PostgreSQL', '', '', '', null::date, null::date, '', '', array[]::text[], 3, true),
  ('professional_learning', '', 'Advanced Flutter development', '', '', '', null::date, null::date, '', '', array[]::text[], 4, true),
  ('professional_learning', '', 'Backend engineering', '', '', '', null::date, null::date, '', '', array[]::text[], 5, true),
  ('professional_learning', '', 'Cloud infrastructure', '', '', '', null::date, null::date, '', '', array[]::text[], 6, true),
  ('professional_learning', '', 'AI and ML infrastructure', '', '', '', null::date, null::date, '', '', array[]::text[], 7, true),
  ('professional_learning', '', 'Cybersecurity', '', '', '', null::date, null::date, '', '', array[]::text[], 8, true),
  ('professional_learning', '', 'Software architecture', '', '', '', null::date, null::date, '', '', array[]::text[], 9, true)
) as v
where not exists (select 1 from public.education);

-- Skills -----------------------------------------------------------------------

insert into public.skill_categories (name, slug, description, sort_order, published) values
  ('Frontend Engineering',     'frontend-engineering',     'Interfaces for the web, built to be fast, accessible and maintainable.', 1, true),
  ('Mobile Engineering',       'mobile-engineering',       'Cross-platform applications for Android and iOS from a single codebase.', 2, true),
  ('Backend Engineering',      'backend-engineering',      'APIs, authentication and business logic behind web and mobile clients.', 3, true),
  ('Database Engineering',     'database-engineering',     'Relational and document data stores, schema design and data modelling.', 4, true),
  ('Cloud and Infrastructure', 'cloud-and-infrastructure', 'Version control, containers, servers and deployment.', 5, true),
  ('Cybersecurity',            'cybersecurity',            'Security principles and tooling applied to the applications I build.', 6, true),
  ('Creative Technologies',    'creative-technologies',    'Design tools and practice for brand, publication and interface work.', 7, true)
on conflict (slug) do nothing;

insert into public.skills (category_id, name, sort_order, published)
select c.id, v.name, v.sort_order, true
from (values
  ('frontend-engineering', 'JavaScript', 1), ('frontend-engineering', 'TypeScript', 2),
  ('frontend-engineering', 'React', 3), ('frontend-engineering', 'Next.js', 4),
  ('frontend-engineering', 'HTML5', 5), ('frontend-engineering', 'CSS3', 6),
  ('frontend-engineering', 'Responsive web development', 7),
  ('mobile-engineering', 'Flutter', 1), ('mobile-engineering', 'Dart', 2),
  ('mobile-engineering', 'Android development', 3), ('mobile-engineering', 'iOS development', 4),
  ('mobile-engineering', 'Cross-platform application architecture', 5),
  ('backend-engineering', 'Python', 1), ('backend-engineering', 'Django', 2),
  ('backend-engineering', 'FastAPI', 3), ('backend-engineering', 'Node.js', 4),
  ('backend-engineering', 'Express.js', 5), ('backend-engineering', 'REST API development', 6),
  ('database-engineering', 'PostgreSQL', 1), ('database-engineering', 'MongoDB', 2),
  ('database-engineering', 'Supabase', 3), ('database-engineering', 'Database architecture', 4),
  ('database-engineering', 'Data modelling', 5),
  ('cloud-and-infrastructure', 'Docker', 1), ('cloud-and-infrastructure', 'Linux', 2),
  ('cloud-and-infrastructure', 'Git', 3), ('cloud-and-infrastructure', 'GitHub', 4),
  ('cloud-and-infrastructure', 'Vercel', 5), ('cloud-and-infrastructure', 'Render', 6),
  ('cloud-and-infrastructure', 'VPS administration', 7), ('cloud-and-infrastructure', 'Application deployment', 8),
  ('cybersecurity', 'OWASP security principles', 1), ('cybersecurity', 'Burp Suite', 2),
  ('cybersecurity', 'Wireshark', 3), ('cybersecurity', 'Metasploit', 4),
  ('cybersecurity', 'Application security testing', 5),
  ('creative-technologies', 'Adobe Illustrator', 1), ('creative-technologies', 'Adobe Photoshop', 2),
  ('creative-technologies', 'Figma', 3), ('creative-technologies', 'UI/UX design', 4),
  ('creative-technologies', 'Brand identity design', 5)
) as v(category_slug, name, sort_order)
join public.skill_categories c on c.slug = v.category_slug
on conflict (category_id, name) do nothing;

-- Projects ---------------------------------------------------------------------

insert into public.project_categories (name, slug, sort_order) values
  ('Web Applications',         'web-applications',    1),
  ('Mobile Applications',      'mobile-applications', 2),
  ('Backend Systems',          'backend-systems',     3),
  ('Data and Analytics',       'data-and-analytics',  4),
  ('Other Technical Projects', 'other-technical',     5)
on conflict (slug) do nothing;

insert into public.projects
  (slug, title, summary, category_id, status, overview, problem, solution, role, objectives, features,
   architecture, technologies, implementation, data_architecture, challenges, live_url, repo_url,
   cover_path, featured, published, sort_order)
values
  (
    'flashx', 'FlashX',
    'A mobile social networking application for Android and iOS with posts, stories, short-form video, messaging and live streaming.',
    (select id from public.project_categories where slug = 'mobile-applications'),
    'in_development',
    'FlashX is a social networking application for Android and iOS. People share posts, stories and short-form videos, message each other, and broadcast live. The Flutter app talks to a REST API that I designed and built first, before any of the mobile screens.',
    '',
    'I built the complete backend first as a Django REST Framework API, then the Flutter client on top of it. Media is uploaded from the phone directly to Cloudinary using signed uploads, so large video files never pass through the API server.',
    'Sole developer. I designed the data model and API, built the Flutter application, and handle builds and deployment.',
    array[
      'Give the product its own identity instead of copying an existing social app.',
      'Keep the mobile client thin, with all business rules in the API.',
      'Run on both Android and iOS from one codebase.'
    ],
    array[
      'Posts, stories and short-form videos',
      'Direct messaging',
      'Live streaming with real-time viewer interaction',
      'Discovery and search',
      'Token-based authentication with rotating refresh tokens',
      'Admin and moderation tools'
    ],
    'A Flutter client communicates only with a Django REST Framework API over HTTPS. Authentication uses short-lived JSON Web Tokens with rotating refresh tokens that are blacklisted on logout. Application data lives in PostgreSQL. Media files live on Cloudinary and are uploaded from the device with signed requests.',
    array['Flutter', 'Dart', 'Django', 'Django REST Framework', 'PostgreSQL', 'Cloudinary'],
    'State management in the Flutter app uses Provider. The API is documented with OpenAPI. Search uses PostgreSQL trigram matching.',
    'PostgreSQL holds accounts, content, relationships and messages. Media is stored on Cloudinary and referenced by identifier.',
    '[]'::jsonb,
    '', '', null, true, true, 1
  ),
  (
    'nairobi-vacant-houses', 'Nairobi Vacant Houses',
    'A property discovery platform that helps people find vacant rental houses around Nairobi.',
    (select id from public.project_categories where slug = 'web-applications'),
    'live',
    'Nairobi Vacant Houses is a listing platform for rental property in Nairobi and its surroundings. Landlords and agents list vacant houses with the price, amenities, location and a phone number, and people looking for a home browse and contact them directly.',
    'Finding a vacant house in Nairobi usually means walking through estates looking for signs on gates, or relying on agents. Listings are scattered and often out of date.',
    'A single place where vacant houses are listed with the details a tenant needs before making a call: price, amenities, location and contact number.',
    'Sole developer and designer, including the brand identity.',
    array[]::text[],
    array[
      'Property listings with price, amenities, location and contact number',
      'Multi-step listing creation for landlords',
      'Listing payment by M-Pesa with approval before a listing is published',
      'Account registration and sign-in'
    ],
    '',
    array['Next.js', 'Django', 'PostgreSQL', 'M-Pesa'],
    '', '',
    '[]'::jsonb,
    'https://nairobivacanthouses.com', '', null, true, true, 2
  ),
  (
    'naretu-ecommerce', 'Naretu E-commerce',
    'A multi-vendor e-commerce platform that connects buyers and sellers in one online marketplace.',
    (select id from public.project_categories where slug = 'web-applications'),
    'live',
    'Naretu is a multi-vendor marketplace. Vendors list products by category, manage inventory, set prices and track orders. Customers browse, search, compare products and pay online.',
    '', '',
    'Developer.',
    array[]::text[],
    array[
      'Vendor product listings organised by category',
      'Inventory and price management for vendors',
      'Order tracking',
      'Product browsing, search and comparison',
      'Online checkout with M-Pesa'
    ],
    '',
    array['Next.js', 'CSS', 'PostgreSQL', 'M-Pesa'],
    '', '',
    '[]'::jsonb,
    'https://naretu.com', '', null, true, true, 3
  ),
  (
    'kibarua', 'Kibarua',
    'A local services platform that connects customers with nearby service providers.',
    (select id from public.project_categories where slug = 'mobile-applications'),
    'in_development',
    'Kibarua connects people who need a job done with service providers near them. Customers discover services, view provider profiles and send location-based requests, then communicate with the provider to coordinate the work.',
    '', '', '',
    array[]::text[],
    array[
      'Service discovery',
      'Provider profiles',
      'Location-based service requests',
      'Communication between customer and provider',
      'Service coordination'
    ],
    '', array[]::text[], '', '',
    '[]'::jsonb,
    '', '', null, false, true, 4
  ),
  (
    'ssb-tax-model', 'SSB Tax Model',
    'A web application for health tax simulation, with a Next.js interface and a Python computation backend.',
    (select id from public.project_categories where slug = 'data-and-analytics'),
    'in_development',
    'The SSB Tax Model is a health financing tool that lets a user run a tax simulation for sugar-sweetened beverages in the browser instead of in a spreadsheet. It was developed as part of my consultancy work on health tax modelling.',
    'The underlying models existed as Excel workbooks. Workbooks are hard to share, easy to break and difficult for a non-specialist to operate.',
    'I rebuilt the workbook logic as a Python computation engine and put a web interface in front of it. The user enters parameters, the backend runs the model, and the results are presented in the browser.',
    'Developer. I built the interface and implemented the model computations from the workbooks supplied to me.',
    array[
      'Reproduce the workbook calculations faithfully in code.',
      'Make the model usable by someone who has never opened the workbook.'
    ],
    array[
      'Parameter entry through a web interface',
      'Model computation on a Python backend',
      'Presentation of model outputs in the browser'
    ],
    'A Next.js front end sends model inputs to a Python API, which runs the computation and returns the outputs for display.',
    array['Next.js', 'Python', 'Django REST Framework', 'NumPy'],
    'The central constraint was fidelity to the source workbook: each computed value is checked against the corresponding spreadsheet cell.',
    '',
    '[{"challenge": "Spreadsheet formulas hide their dependencies across sheets.", "solution": "I traced each output back through the workbook and reimplemented the chain step by step, verifying intermediate values against the original cells."}]'::jsonb,
    '', '', null, true, true, 5
  )
on conflict (slug) do nothing;

-- Creative gallery -------------------------------------------------------------

insert into public.gallery_categories (name, slug, sort_order) values
  ('Brand Identity',        'brand-identity',        1),
  ('Logo Design',           'logo-design',           2),
  ('Corporate Branding',    'corporate-branding',    3),
  ('Publications',          'publications',          4),
  ('Posters',               'posters',               5),
  ('Social Media Graphics', 'social-media-graphics', 6),
  ('UI/UX Design',          'ui-ux-design',          7),
  ('Infographics',          'infographics',          8),
  ('Data Visualisation',    'data-visualisation',    9),
  ('Presentation Design',   'presentation-design',   10)
on conflict (slug) do nothing;

-- Gallery images and project screenshots are not seeded: upload them in the
-- admin (Creative gallery > Upload several images, and each project's
-- Screenshots panel) so they are stored in Supabase Storage.
