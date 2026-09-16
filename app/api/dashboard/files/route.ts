import { inventory } from '../../../../lib/croquis';

export const runtime = 'nodejs';

// GET /api/dashboard/files?limit=10&page=0 → paginated file list
export async function GET(
  request: Request,
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '0';

    const files = await inventory();

    const totalPages = Math.ceil(files.length / Number(limit));
    const currentPage = Math.max(0, parseInt(page) || 0);

    const start = currentPage * Number(limit);
    const end = start + Number(limit);

    const pages: { files: unknown[]; total: number; totalPages: number } = {
      files: files.slice(start, end),
      total: files.length,
      totalPages: totalPages,
    };

    return Response.json(pages);

  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erreur' }, { status: 500 });
  }
}
