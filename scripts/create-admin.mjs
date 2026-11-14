

import { createInterface } from 'node:readline/promises';
import { createClient } from '@supabase/supabase-js';

const [email, fullName = ''] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs <email> ["Full Name"]');
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question('Password (at least 12 characters): ');
  prompt.close();
  return answer;
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUser(address) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === address.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

try {
  let user = await findUser(email);

  if (!user) {
    const password = await readPassword();
    if (password.length < 12) {
      console.error('The password must be at least 12 characters.');
      process.exit(1);
    }
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
    console.log(`Created user ${email}.`);
  } else {
    console.log(`User ${email} already exists; granting the admin role.`);
  }

  const { error: roleError } = await supabase
    .from('admin_profiles')
    .upsert({ user_id: user.id, role: 'admin', full_name: fullName || null });
  if (roleError) throw roleError;

  console.log('Administrator role granted. Sign in at /admin/login.');
} catch (error) {
  console.error('Could not create the administrator:', error.message ?? error);
  process.exit(1);
}
