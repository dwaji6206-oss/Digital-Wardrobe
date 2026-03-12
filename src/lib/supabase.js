import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lcmgtuuwhetutcvbbqfh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2c7KzUk9Z2LIGRYDuRLKVQ_AJqnDiC0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  STORAGE_BUCKETS: {
    CLOTHES: 'clothes-images',
    OUTFITS: 'outfits-images'
  }
};
