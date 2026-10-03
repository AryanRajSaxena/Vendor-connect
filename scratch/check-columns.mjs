import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function checkSampleData() {
  const { data: users, error: uErr } = await supabase.from('users').select('*').limit(1);
  if (users && users.length > 0) {
    console.log('User columns:', Object.keys(users[0]));
  } else {
    console.log('User sample error or empty:', uErr);
  }

  const { data: prods, error: pErr } = await supabase.from('products').select('*').limit(1);
  if (prods && prods.length > 0) {
    console.log('Product columns:', Object.keys(prods[0]));
  } else {
    console.log('Product sample error or empty:', pErr);
  }
}

checkSampleData().then(() => console.log('Done checking sample columns.'));
