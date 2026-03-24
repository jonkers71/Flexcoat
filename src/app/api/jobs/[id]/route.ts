import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// ── Auth guard helper ────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return { user: null, supabase, isAdmin: false };

  const role = (user.user_metadata?.role as string) || 'user';
  return { user, supabase, isAdmin: role === 'admin' };
}

// ── DELETE /api/jobs/[id] — Delete a job and its associated files ────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, isAdmin } = await requireAdmin();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    // 1. Fetch the job first to get the pdf_url for cleanup
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('pdf_url, data')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // 2. Delete associated PDF from storage if it exists
    if (job?.pdf_url) {
      try {
        // Extract the file path from the public URL
        const url = new URL(job.pdf_url);
        // URL format: .../storage/v1/object/public/job-cards/<filename>
        const pathParts = url.pathname.split('/job-cards/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage.from('job-cards').remove([filePath]);
        }
      } catch (storageErr) {
        // Log but don't fail the delete if storage cleanup fails
        console.error('PDF storage cleanup failed:', storageErr);
      }
    }

    // 3. Delete associated photos from storage
    // Photos are stored as URLs in the job data sections — scan for them
    try {
      const sections = job?.data as any[];
      if (Array.isArray(sections)) {
        const photoUrls: string[] = [];
        sections.forEach((section: any) => {
          if (Array.isArray(section?.photos)) {
            photoUrls.push(...section.photos);
          }
        });
        if (photoUrls.length > 0) {
          const photoPaths = photoUrls.map((url: string) => {
            const parts = url.split('/job-photos/');
            return parts.length > 1 ? parts[1] : null;
          }).filter(Boolean) as string[];

          if (photoPaths.length > 0) {
            await supabase.storage.from('job-photos').remove(photoPaths);
          }
        }
      }
    } catch (photoErr) {
      console.error('Photo storage cleanup failed:', photoErr);
    }

    // 4. Delete the database record
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// ── PATCH /api/jobs/[id] — Update job status (admin only) ───────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, isAdmin } = await requireAdmin();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('jobs')
      .update(body)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
