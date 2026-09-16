import { safeFile } from '@/lib/croquis';
import { detectSignature } from '@/lib/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const mediaTypes = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpeg: 'image/jpeg',
  tiff: 'image/tiff',
} as const;

export async function GET(request: Request) {
  const fileName = new URL(request.url).searchParams.get('file');
  if (!fileName) return Response.json({ error: 'Paramètre file requis' }, { status: 400 });

  const bytes = await safeFile(fileName);
  if (!bytes) return Response.json({ error: 'Croquis introuvable ou non autorisé' }, { status: 404 });
  const kind = detectSignature(bytes.subarray(0, 16));
  const contentType = mediaTypes[kind as keyof typeof mediaTypes];
  if (!contentType) return Response.json({ error: 'Format de croquis non visualisable' }, { status: 415 });

  return new Response(bytes, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'no-store',
    },
  });
}
