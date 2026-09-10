import { supabaseAdmin } from '../src/config/supabase';

async function cleanBloat() {
  console.log('=== STARTING SUPABASE DATABASE PAYLOAD CLEANUP ===\n');

  // 1. Clean bloated avatars in `profiles`
  const { data: profiles, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, avatar_url');

  if (profErr) {
    console.error('Error fetching profiles:', profErr.message);
  } else if (profiles) {
    let cleanedProfiles = 0;
    for (const p of profiles) {
      if (p.avatar_url && (p.avatar_url.startsWith('data:') || p.avatar_url.length > 50000)) {
        const cleanAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.email || p.id)}`;
        const { error: updErr } = await supabaseAdmin
          .from('profiles')
          .update({ avatar_url: cleanAvatar })
          .eq('id', p.id);

        if (updErr) {
          console.error(`Failed to clean profile ${p.email} (${p.id}):`, updErr.message);
        } else {
          console.log(`✅ Cleaned bloated avatar for profile: ${p.email || p.id} (was ${(p.avatar_url.length / 1024).toFixed(1)} KB -> now clean URL)`);
          cleanedProfiles++;
        }
      }
    }
    console.log(`Total profiles cleaned: ${cleanedProfiles}\n`);
  }

  // 2. Clean bloated thumbnails in `courses`
  const { data: courses, error: courseErr } = await supabaseAdmin
    .from('courses')
    .select('id, title, thumbnail');

  if (courseErr) {
    console.error('Error fetching courses:', courseErr.message);
  } else if (courses) {
    const defaultThumbnails = [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=80'
    ];

    let cleanedCourses = 0;
    for (let i = 0; i < courses.length; i++) {
      const c = courses[i];
      if (c.thumbnail && (c.thumbnail.startsWith('data:') || c.thumbnail.length > 50000)) {
        const cleanThumb = defaultThumbnails[i % defaultThumbnails.length];
        const { error: updErr } = await supabaseAdmin
          .from('courses')
          .update({ thumbnail: cleanThumb })
          .eq('id', c.id);

        if (updErr) {
          console.error(`Failed to clean course ${c.title} (${c.id}):`, updErr.message);
        } else {
          console.log(`✅ Cleaned bloated thumbnail for course: "${c.title}" (was ${(c.thumbnail.length / 1024).toFixed(1)} KB -> now clean CDN URL)`);
          cleanedCourses++;
        }
      }
    }
    console.log(`Total courses cleaned: ${cleanedCourses}\n`);
  }

  console.log('=== CLEANUP COMPLETE ===');
}

cleanBloat().catch(console.error);
