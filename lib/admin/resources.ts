// Declarative description of every content type managed in the admin.
// The list pages, edit forms and server-side validation are all generated
// from these definitions, so a field is described exactly once.
//
// This module is imported by both client and server code and must stay free
// of secrets and server-only imports.

import type { BucketId } from '@/lib/storage';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'longtext'
  | 'url'
  | 'email'
  | 'slug'
  | 'date'
  | 'number'
  | 'boolean'
  | 'select'
  | 'relation'
  | 'list'
  | 'pairs'
  | 'image'
  | 'file';

export interface PairField {
  key: string;
  label: string;
  multiline?: boolean;
  url?: boolean;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  maxLength?: number;
  half?: boolean;
  /** select */
  options?: Array<{ value: string; label: string }>;
  /** relation: key of the resource that supplies the options */
  relation?: ResourceKey;
  /** slug: field the slug is generated from */
  slugFrom?: string;
  /** image / file */
  bucket?: BucketId;
  folder?: string;
  /** pairs */
  pairFields?: PairField[];
  itemLabel?: string;
  /** number */
  min?: number;
  max?: number;
}

export interface FieldGroup {
  title: string;
  description?: string;
  fields: FieldDef[];
}

export interface ListColumn {
  field: string;
  label: string;
  type?: 'text' | 'relation' | 'status' | 'image';
}

export interface ResourceDef {
  key: ResourceKey;
  table: string;
  singular: string;
  plural: string;
  description: string;
  singleton?: boolean;
  titleField: string;
  subtitleField?: string;
  imageField?: string;
  publishable: boolean;
  featurable?: boolean;
  orderable: boolean;
  /** Default sort for non-orderable resources (e.g. newest posts first). */
  defaultOrder?: { column: string; ascending: boolean };
  searchFields: string[];
  columns: ListColumn[];
  filterField?: string;
  groups: FieldGroup[];
}

export type ResourceKey =
  | 'profile'
  | 'homepage'
  | 'settings'
  | 'experience'
  | 'education'
  | 'skill-categories'
  | 'skills'
  | 'project-categories'
  | 'projects'
  | 'gallery-categories'
  | 'gallery'
  | 'social-links'
  | 'documents'
  | 'posts';

const PROJECT_STATUS = [
  { value: 'in_development', label: 'In development' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  profile: {
    key: 'profile',
    table: 'profiles',
    singular: 'Profile',
    plural: 'Profile',
    description: 'Your name, biography, portrait and contact details. Shown on the About and Contact pages.',
    singleton: true,
    titleField: 'full_name',
    publishable: false,
    orderable: false,
    searchFields: [],
    columns: [],
    groups: [
      {
        title: 'Identity',
        fields: [
          { name: 'full_name', label: 'Professional name', type: 'text', required: true, maxLength: 120, half: true },
          { name: 'headline', label: 'Professional headline', type: 'text', maxLength: 160, half: true },
          { name: 'short_intro', label: 'Short introduction', type: 'textarea', maxLength: 500, help: 'One or two sentences. Used under page titles and in search results.' },
          { name: 'photo_path', label: 'Profile photograph', type: 'image', bucket: 'profile-images', folder: 'portrait' },
        ],
      },
      {
        title: 'Biography',
        description: 'Leave a blank line between paragraphs.',
        fields: [
          { name: 'biography', label: 'Biography', type: 'longtext', maxLength: 12000 },
          { name: 'philosophy', label: 'Working philosophy', type: 'longtext', maxLength: 6000 },
          {
            name: 'journey',
            label: 'Professional journey',
            type: 'pairs',
            itemLabel: 'step',
            pairFields: [
              { key: 'period', label: 'Period' },
              { key: 'title', label: 'Title' },
              { key: 'description', label: 'Description', multiline: true },
            ],
          },
          { name: 'interests', label: 'Professional interests', type: 'list', itemLabel: 'interest' },
        ],
      },
      {
        title: 'Contact details',
        fields: [
          { name: 'location', label: 'Location', type: 'text', maxLength: 120, half: true },
          { name: 'email', label: 'Email', type: 'email', maxLength: 254, half: true },
          { name: 'phone', label: 'Phone number', type: 'text', maxLength: 40, half: true },
          { name: 'github_url', label: 'GitHub URL', type: 'url', half: true },
          { name: 'linkedin_url', label: 'LinkedIn URL', type: 'url', half: true },
        ],
      },
    ],
  },

  homepage: {
    key: 'homepage',
    table: 'homepage_content',
    singular: 'Homepage',
    plural: 'Homepage',
    description: 'Hero text, buttons and the introduction and contact sections of the homepage.',
    singleton: true,
    titleField: 'hero_heading',
    publishable: false,
    orderable: false,
    searchFields: [],
    columns: [],
    groups: [
      {
        title: 'Hero',
        fields: [
          { name: 'professional_title', label: 'Professional title', type: 'text', maxLength: 120, help: 'Small line above the heading.' },
          { name: 'hero_heading', label: 'Hero heading', type: 'textarea', required: true, maxLength: 200 },
          { name: 'hero_description', label: 'Hero description', type: 'textarea', maxLength: 600 },
          { name: 'disciplines', label: 'Professional disciplines', type: 'list', itemLabel: 'discipline', help: 'Shown in a row under the hero. Four works best.' },
          { name: 'hero_image_path', label: 'Hero photograph', type: 'image', bucket: 'profile-images', folder: 'hero', help: 'Leave empty to use the profile photograph.' },
        ],
      },
      {
        title: 'Buttons',
        description: 'Use a path such as /projects, or /api/cv to link to the current CV.',
        fields: [
          { name: 'primary_button_text', label: 'Primary button text', type: 'text', maxLength: 40, half: true },
          { name: 'primary_button_link', label: 'Primary button link', type: 'text', maxLength: 300, half: true },
          { name: 'secondary_button_text', label: 'Secondary button text', type: 'text', maxLength: 40, half: true },
          { name: 'secondary_button_link', label: 'Secondary button link', type: 'text', maxLength: 300, half: true },
        ],
      },
      {
        title: 'About introduction',
        fields: [
          { name: 'about_heading', label: 'Heading', type: 'text', maxLength: 160 },
          { name: 'about_intro', label: 'Introduction', type: 'longtext', maxLength: 2000 },
        ],
      },
      {
        title: 'Contact invitation',
        fields: [
          { name: 'contact_heading', label: 'Heading', type: 'text', maxLength: 160 },
          { name: 'contact_invitation', label: 'Invitation text', type: 'textarea', maxLength: 600 },
        ],
      },
    ],
  },

  settings: {
    key: 'settings',
    table: 'website_settings',
    singular: 'Website settings',
    plural: 'Website settings',
    description: 'Site title, search engine defaults, logo, favicon and footer.',
    singleton: true,
    titleField: 'site_title',
    publishable: false,
    orderable: false,
    searchFields: [],
    columns: [],
    groups: [
      {
        title: 'Identity',
        fields: [
          { name: 'site_title', label: 'Website title', type: 'text', required: true, maxLength: 120, half: true },
          { name: 'wordmark', label: 'Wordmark', type: 'text', maxLength: 60, half: true, help: 'Name shown in the header and footer when no signature or logo is uploaded.' },
          { name: 'logo_path', label: 'Signature or logo', type: 'image', bucket: 'website-assets', folder: 'logo', help: 'Optional. Shown in the header and footer in place of your name. Use dark ink on a transparent background (PNG, SVG or WebP); it is turned white automatically on dark backgrounds.' },
          { name: 'favicon_path', label: 'Favicon', type: 'image', bucket: 'website-assets', folder: 'favicon' },
        ],
      },
      {
        title: 'Search and sharing',
        fields: [
          { name: 'meta_description', label: 'Default meta description', type: 'textarea', maxLength: 320 },
          { name: 'seo_keywords', label: 'Keywords', type: 'list', itemLabel: 'keyword' },
          { name: 'og_image_path', label: 'Open Graph image', type: 'image', bucket: 'website-assets', folder: 'og', help: '1200 x 630 pixels. Leave empty to use the generated default.' },
        ],
      },
      {
        title: 'Billing and banking',
        description: 'Shown on every invoice and quotation. Entered once here, not per document.',
        fields: [
          { name: 'invoice_from_address', label: 'Your address (shown as sender)', type: 'textarea', maxLength: 300, help: 'One line per line, e.g. 7 Donholm 00200 / Nairobi, Kenya.' },
          { name: 'bank_account_name', label: 'Account holder name', type: 'text', maxLength: 200, half: true },
          { name: 'bank_account_number', label: 'Account number', type: 'text', maxLength: 60, half: true },
          { name: 'bank_name', label: 'Bank name', type: 'text', maxLength: 120, half: true },
          { name: 'bank_branch', label: 'Branch', type: 'text', maxLength: 120, half: true },
          { name: 'bank_address', label: 'Bank address', type: 'text', maxLength: 200 },
          { name: 'bank_swift', label: 'SWIFT code', type: 'text', maxLength: 40, half: true },
          { name: 'bank_iban', label: 'IBAN', type: 'text', maxLength: 60, half: true },
          { name: 'mpesa_details', label: 'M-Pesa details', type: 'text', maxLength: 200, help: 'Optional, e.g. Paybill 123456, Account: your name.' },
        ],
      },
      {
        title: 'Footer',
        fields: [
          { name: 'footer_text', label: 'Footer text', type: 'textarea', maxLength: 300 },
          { name: 'copyright_holder', label: 'Copyright holder', type: 'text', maxLength: 120, half: true },
          { name: 'copyright_start_year', label: 'Copyright start year', type: 'number', min: 1990, max: 2100, half: true, help: 'The current year is added automatically.' },
        ],
      },
      {
        title: 'Security',
        description: 'Controls account recovery for the admin panel.',
        fields: [
          {
            name: 'admin_reset_email',
            label: 'Recovery email',
            type: 'email',
            maxLength: 254,
            help: 'The only address that can receive an admin password-reset link. Must be an inbox you control and match your Supabase login email.',
          },
        ],
      },
    ],
  },

  experience: {
    key: 'experience',
    table: 'experiences',
    singular: 'Experience',
    plural: 'Experience',
    description: 'Employment and engagement history shown on the Experience page.',
    titleField: 'job_title',
    subtitleField: 'organisation',
    imageField: 'logo_path',
    publishable: true,
    orderable: true,
    searchFields: ['job_title', 'organisation', 'department'],
    columns: [
      { field: 'job_title', label: 'Role' },
      { field: 'date_display', label: 'Dates' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Role',
        fields: [
          { name: 'organisation', label: 'Organisation name', type: 'text', required: true, maxLength: 200, half: true },
          { name: 'department', label: 'Department', type: 'text', maxLength: 200, half: true },
          { name: 'job_title', label: 'Job title', type: 'text', required: true, maxLength: 200, half: true },
          { name: 'engagement_type', label: 'Employment or engagement type', type: 'text', maxLength: 80, half: true, placeholder: 'Full-time, Consultancy, Internship' },
          { name: 'location', label: 'Location', type: 'text', maxLength: 120, half: true },
          { name: 'logo_path', label: 'Organisation logo', type: 'image', bucket: 'organisation-logos', folder: 'logos' },
        ],
      },
      {
        title: 'Dates',
        fields: [
          { name: 'start_date', label: 'Start date', type: 'date', half: true },
          { name: 'end_date', label: 'End date', type: 'date', half: true },
          { name: 'is_current', label: 'This is my current position', type: 'boolean' },
          { name: 'date_display', label: 'Date text shown on the site', type: 'text', maxLength: 80, help: 'Optional. Overrides the dates above, for example "2019" when only the year is known.' },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'overview', label: 'Professional overview', type: 'longtext', maxLength: 4000 },
          { name: 'responsibilities', label: 'Responsibilities', type: 'list', itemLabel: 'responsibility' },
          { name: 'contributions', label: 'Key contributions', type: 'list', itemLabel: 'contribution' },
          { name: 'deliverables', label: 'Deliverables', type: 'list', itemLabel: 'deliverable' },
          { name: 'technologies', label: 'Technologies and tools', type: 'list', itemLabel: 'technology' },
        ],
      },
      {
        title: 'Links',
        fields: [
          {
            name: 'related_links',
            label: 'Related project links',
            type: 'pairs',
            itemLabel: 'link',
            pairFields: [
              { key: 'label', label: 'Label' },
              { key: 'url', label: 'URL', url: true },
            ],
          },
          {
            name: 'attachments',
            label: 'Supporting images or documents',
            type: 'pairs',
            itemLabel: 'attachment',
            pairFields: [
              { key: 'label', label: 'Label' },
              { key: 'url', label: 'URL', url: true },
            ],
          },
        ],
      },
    ],
  },

  education: {
    key: 'education',
    table: 'education',
    singular: 'Education record',
    plural: 'Education',
    description: 'Formal qualifications and self-directed professional learning.',
    titleField: 'qualification',
    subtitleField: 'institution',
    publishable: true,
    orderable: true,
    searchFields: ['qualification', 'institution', 'field_of_study'],
    filterField: 'kind',
    columns: [
      { field: 'qualification', label: 'Qualification' },
      { field: 'kind', label: 'Type' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Qualification',
        fields: [
          {
            name: 'kind',
            label: 'Type',
            type: 'select',
            required: true,
            options: [
              { value: 'formal', label: 'Formal qualification' },
              { value: 'professional_learning', label: 'Professional learning' },
            ],
            half: true,
          },
          { name: 'qualification', label: 'Qualification or subject', type: 'text', required: true, maxLength: 250 },
          { name: 'institution', label: 'Institution', type: 'text', maxLength: 200, half: true },
          { name: 'field_of_study', label: 'Field of study', type: 'text', maxLength: 200, half: true },
          { name: 'awarding_body', label: 'Examination or awarding body', type: 'text', maxLength: 200, half: true },
          { name: 'exam_series', label: 'Examination series', type: 'text', maxLength: 80, half: true },
        ],
      },
      {
        title: 'Dates',
        fields: [
          { name: 'start_date', label: 'Start date', type: 'date', half: true },
          { name: 'end_date', label: 'Completion date', type: 'date', half: true },
          { name: 'date_display', label: 'Date text shown on the site', type: 'text', maxLength: 80, help: 'Optional. Overrides the dates above.' },
        ],
      },
      {
        title: 'Details',
        fields: [
          { name: 'description', label: 'Description', type: 'longtext', maxLength: 3000 },
          { name: 'coursework', label: 'Relevant coursework', type: 'list', itemLabel: 'course' },
          { name: 'certificate_path', label: 'Certificate (PDF)', type: 'file', bucket: 'documents', folder: 'certificates', help: 'Stored privately. Not shown on the public site.' },
        ],
      },
    ],
  },

  'skill-categories': {
    key: 'skill-categories',
    table: 'skill_categories',
    singular: 'Skill category',
    plural: 'Skill categories',
    description: 'Groups shown on the Expertise page. Hiding a category hides its skills.',
    titleField: 'name',
    publishable: true,
    orderable: true,
    searchFields: ['name'],
    columns: [
      { field: 'name', label: 'Category' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Category',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120, half: true },
          { name: 'slug', label: 'Slug', type: 'slug', required: true, slugFrom: 'name', half: true },
          { name: 'description', label: 'Description', type: 'textarea', maxLength: 400 },
        ],
      },
    ],
  },

  skills: {
    key: 'skills',
    table: 'skills',
    singular: 'Skill',
    plural: 'Skills',
    description: 'Individual skills, grouped by category on the Expertise page.',
    titleField: 'name',
    publishable: true,
    orderable: true,
    searchFields: ['name', 'description'],
    filterField: 'category_id',
    columns: [
      { field: 'name', label: 'Skill' },
      { field: 'category_id', label: 'Category', type: 'relation' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Skill',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120, half: true },
          { name: 'category_id', label: 'Category', type: 'relation', relation: 'skill-categories', required: true, half: true },
          { name: 'description', label: 'Description', type: 'textarea', maxLength: 400, help: 'Optional. A short note on how you use it.' },
        ],
      },
    ],
  },

  'project-categories': {
    key: 'project-categories',
    table: 'project_categories',
    singular: 'Project category',
    plural: 'Project categories',
    description: 'Filters shown on the Projects page.',
    titleField: 'name',
    publishable: false,
    orderable: true,
    searchFields: ['name'],
    columns: [{ field: 'name', label: 'Category' }, { field: 'slug', label: 'Slug' }],
    groups: [
      {
        title: 'Category',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120, half: true },
          { name: 'slug', label: 'Slug', type: 'slug', required: true, slugFrom: 'name', half: true },
        ],
      },
    ],
  },

  projects: {
    key: 'projects',
    table: 'projects',
    singular: 'Project',
    plural: 'Projects',
    description: 'Software projects and their case studies. Featured projects appear on the homepage.',
    titleField: 'title',
    subtitleField: 'summary',
    imageField: 'cover_path',
    publishable: true,
    featurable: true,
    orderable: true,
    searchFields: ['title', 'summary', 'slug'],
    filterField: 'category_id',
    columns: [
      { field: 'title', label: 'Project' },
      { field: 'category_id', label: 'Category', type: 'relation' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Basics',
        fields: [
          { name: 'title', label: 'Project title', type: 'text', required: true, maxLength: 200, half: true },
          { name: 'slug', label: 'Slug', type: 'slug', required: true, slugFrom: 'title', half: true, help: 'Used in the address: /projects/your-slug' },
          { name: 'summary', label: 'Short description', type: 'textarea', maxLength: 300, help: 'Shown on project cards.' },
          { name: 'category_id', label: 'Category', type: 'relation', relation: 'project-categories', half: true },
          { name: 'status', label: 'Project status', type: 'select', options: PROJECT_STATUS, required: true, half: true },
          { name: 'cover_path', label: 'Cover image', type: 'image', bucket: 'project-images', folder: 'covers' },
          { name: 'featured', label: 'Feature this project on the homepage', type: 'boolean' },
        ],
      },
      {
        title: 'Case study',
        description: 'Sections left empty are not shown on the project page.',
        fields: [
          { name: 'overview', label: 'Project overview', type: 'longtext', maxLength: 6000 },
          { name: 'problem', label: 'Problem statement', type: 'longtext', maxLength: 6000 },
          { name: 'solution', label: 'Proposed solution', type: 'longtext', maxLength: 6000 },
          { name: 'role', label: 'My role', type: 'textarea', maxLength: 600 },
          { name: 'objectives', label: 'Project objectives', type: 'list', itemLabel: 'objective' },
          { name: 'features', label: 'Main functionality', type: 'list', itemLabel: 'feature' },
        ],
      },
      {
        title: 'Technical detail',
        fields: [
          { name: 'technologies', label: 'Technology stack', type: 'list', itemLabel: 'technology' },
          { name: 'architecture', label: 'Technical architecture', type: 'longtext', maxLength: 6000 },
          { name: 'implementation', label: 'Implementation details', type: 'longtext', maxLength: 6000 },
          { name: 'data_architecture', label: 'Database or system architecture', type: 'longtext', maxLength: 6000 },
          {
            name: 'challenges',
            label: 'Challenges and solutions',
            type: 'pairs',
            itemLabel: 'challenge',
            pairFields: [
              { key: 'challenge', label: 'Challenge', multiline: true },
              { key: 'solution', label: 'Solution', multiline: true },
            ],
          },
        ],
      },
      {
        title: 'Links and search',
        fields: [
          { name: 'live_url', label: 'Live demonstration URL', type: 'url', half: true },
          { name: 'repo_url', label: 'GitHub repository URL', type: 'url', half: true },
          { name: 'seo_title', label: 'Search title', type: 'text', maxLength: 70, half: true, help: 'Optional. Defaults to the project title.' },
          { name: 'seo_description', label: 'Search description', type: 'textarea', maxLength: 200, help: 'Optional. Defaults to the short description.' },
        ],
      },
    ],
  },

  'gallery-categories': {
    key: 'gallery-categories',
    table: 'gallery_categories',
    singular: 'Gallery category',
    plural: 'Gallery categories',
    description: 'Filters shown on the Creative Work page.',
    titleField: 'name',
    publishable: false,
    orderable: true,
    searchFields: ['name'],
    columns: [{ field: 'name', label: 'Category' }, { field: 'slug', label: 'Slug' }],
    groups: [
      {
        title: 'Category',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120, half: true },
          { name: 'slug', label: 'Slug', type: 'slug', required: true, slugFrom: 'name', half: true },
        ],
      },
    ],
  },

  gallery: {
    key: 'gallery',
    table: 'gallery_images',
    singular: 'Gallery image',
    plural: 'Creative gallery',
    description: 'Design work shown on the Creative Work page.',
    titleField: 'title',
    subtitleField: 'caption',
    imageField: 'image_path',
    publishable: true,
    featurable: true,
    orderable: true,
    searchFields: ['title', 'caption', 'description'],
    filterField: 'category_id',
    columns: [
      { field: 'title', label: 'Image' },
      { field: 'category_id', label: 'Category', type: 'relation' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Image',
        fields: [
          { name: 'image_path', label: 'Image', type: 'image', bucket: 'gallery-images', folder: 'work', required: true },
          { name: 'title', label: 'Title', type: 'text', maxLength: 200, half: true },
          { name: 'category_id', label: 'Category', type: 'relation', relation: 'gallery-categories', half: true },
          { name: 'caption', label: 'Caption', type: 'text', maxLength: 300 },
          { name: 'description', label: 'Description', type: 'longtext', maxLength: 3000 },
          { name: 'external_url', label: 'External project link', type: 'url' },
          { name: 'featured', label: 'Feature this image', type: 'boolean' },
        ],
      },
    ],
  },

  'social-links': {
    key: 'social-links',
    table: 'social_links',
    singular: 'Social link',
    plural: 'Social links',
    description: 'Profile links shown in the footer.',
    titleField: 'label',
    subtitleField: 'url',
    publishable: true,
    orderable: true,
    searchFields: ['label', 'platform', 'url'],
    columns: [
      { field: 'label', label: 'Link' },
      { field: 'platform', label: 'Platform' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Link',
        fields: [
          {
            name: 'platform',
            label: 'Platform',
            type: 'select',
            required: true,
            half: true,
            options: [
              { value: 'github', label: 'GitHub' },
              { value: 'linkedin', label: 'LinkedIn' },
              { value: 'x', label: 'X' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'facebook', label: 'Facebook' },
              { value: 'youtube', label: 'YouTube' },
              { value: 'behance', label: 'Behance' },
              { value: 'dribbble', label: 'Dribbble' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'other', label: 'Other' },
            ],
          },
          { name: 'label', label: 'Label', type: 'text', required: true, maxLength: 60, half: true },
          { name: 'url', label: 'URL', type: 'url', required: true },
        ],
      },
    ],
  },

  posts: {
    key: 'posts',
    table: 'posts',
    singular: 'Post',
    plural: 'Blog',
    description: 'News, updates and short articles shown on the Blog page, newest first.',
    titleField: 'title',
    subtitleField: 'excerpt',
    imageField: 'cover_path',
    publishable: true,
    orderable: false,
    defaultOrder: { column: 'published_at', ascending: false },
    searchFields: ['title', 'excerpt', 'body'],
    columns: [
      { field: 'title', label: 'Post' },
      { field: 'published_at', label: 'Date' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Post',
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 200 },
          { name: 'slug', label: 'Slug', type: 'slug', required: true, slugFrom: 'title', half: true, help: 'Used in the address: /blog/your-slug' },
          { name: 'published_at', label: 'Date', type: 'date', required: true, half: true, help: 'Shown on the post and used to order the blog.' },
          { name: 'cover_path', label: 'Image', type: 'image', bucket: 'gallery-images', folder: 'posts' },
          { name: 'excerpt', label: 'Caption or summary', type: 'textarea', maxLength: 400, help: 'One or two lines. Shown on the blog list and in search results. For a photo update, this is the caption.' },
          { name: 'body', label: 'Body', type: 'longtext', maxLength: 20000, help: 'Optional. Longer text for an article. Leave a blank line between paragraphs. Can be empty for a simple photo and caption.' },
          { name: 'tags', label: 'Tags', type: 'list', itemLabel: 'tag' },
        ],
      },
      {
        title: 'Search',
        fields: [
          { name: 'seo_title', label: 'Search title', type: 'text', maxLength: 70, help: 'Optional. Defaults to the title.' },
          { name: 'seo_description', label: 'Search description', type: 'textarea', maxLength: 200, help: 'Optional. Defaults to the caption.' },
        ],
      },
    ],
  },

  documents: {
    key: 'documents',
    table: 'documents',
    singular: 'Document',
    plural: 'CV and documents',
    description: 'Your CV and other professional documents. The public site always serves the CV marked as current.',
    titleField: 'title',
    subtitleField: 'kind',
    publishable: true,
    orderable: true,
    searchFields: ['title'],
    filterField: 'kind',
    columns: [
      { field: 'title', label: 'Document' },
      { field: 'kind', label: 'Type' },
      { field: 'is_current', label: 'Current CV' },
      { field: 'published', label: 'Status', type: 'status' },
    ],
    groups: [
      {
        title: 'Document',
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 200, half: true, help: 'Used as the download file name.' },
          {
            name: 'kind',
            label: 'Type',
            type: 'select',
            required: true,
            half: true,
            options: [
              { value: 'cv', label: 'CV' },
              { value: 'certificate', label: 'Certificate' },
              { value: 'other', label: 'Other' },
            ],
          },
          { name: 'file_path', label: 'File (PDF)', type: 'file', bucket: 'documents', folder: 'files', required: true },
          { name: 'is_current', label: 'Use this as the current CV', type: 'boolean', help: 'Only applies to documents of type CV. Any other current CV is unset. The CV must also be published.' },
        ],
      },
    ],
  },
};

export function isResourceKey(value: string): value is ResourceKey {
  return Object.prototype.hasOwnProperty.call(RESOURCES, value);
}

export function allFields(resource: ResourceDef): FieldDef[] {
  return resource.groups.flatMap((group) => group.fields);
}

export function optionLabel(field: FieldDef | undefined, value: unknown): string {
  if (!field?.options) return String(value ?? '');
  return field.options.find((option) => option.value === value)?.label ?? String(value ?? '');
}
