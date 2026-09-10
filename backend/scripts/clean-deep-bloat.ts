import { supabaseAdmin } from '../src/config/supabase';

async function cleanDeepBloat() {
  console.log('=== DEEP CLEANING PAYOUT_INFO & PROFILES BLOAT ===');

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, payout_info');

  if (error) {
    console.error('Error fetching profiles:', error.message);
    return;
  }

  for (const p of profiles || []) {
    if (!p.payout_info) continue;

    let modified = false;
    const info = JSON.parse(JSON.stringify(p.payout_info));

    if (Array.isArray(info.payoutHistory)) {
      for (const item of info.payoutHistory) {
        if (item.instructorAvatar && (item.instructorAvatar.startsWith('data:') || item.instructorAvatar.length > 50000)) {
          console.log(`Cleaning bloated instructorAvatar in payoutHistory for profile ${p.email}`);
          item.instructorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.email || p.id)}`;
          modified = true;
        }
        if (item.proofOfPayment && (item.proofOfPayment.startsWith('data:') || item.proofOfPayment.length > 50000)) {
          console.log(`Cleaning bloated proofOfPayment in payoutHistory for profile ${p.email}`);
          item.proofOfPayment = null;
          modified = true;
        }
      }
    }

    if (modified) {
      const { error: updErr } = await supabaseAdmin
        .from('profiles')
        .update({ payout_info: info })
        .eq('id', p.id);

      if (updErr) {
        console.error(`Failed to update payout_info for ${p.email}:`, updErr.message);
      } else {
        console.log(`✅ Successfully sanitized payout_info for ${p.email}`);
      }
    }
  }

  console.log('=== DEEP CLEAN COMPLETE ===');
}

cleanDeepBloat().catch(console.error);
