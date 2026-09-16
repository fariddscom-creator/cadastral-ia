import { inventory } from '@/lib/croquis';
import { readGeoreferences } from '@/lib/georef-store';
import { buildGeoreferenceFileViews } from '@/lib/georeference-view';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
) {
  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit')) || 10));
  const page = Math.max(0, Number(searchParams.get('page')) || 0);
  const [files, georeferences] = await Promise.all([inventory(), readGeoreferences()]);
  const views = buildGeoreferenceFileViews(files, georeferences);
  return Response.json({
    files: views.slice(page * limit, (page + 1) * limit),
    total: views.length,
    totalPages: Math.ceil(views.length / limit),
    currentPage: page,
  });
}
