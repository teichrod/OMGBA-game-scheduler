import { list, put } from '@vercel/blob';

const PATHNAME = 'scheduler/published-schedule.json';

async function readPublishedPayload() {
  const { blobs } = await list({
    prefix: PATHNAME,
    limit: 1,
  });

  if (!blobs.length) {
    return { payload: null };
  }

  const blob = blobs[0];
  const response = await fetch(blob.url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch blob contents: ${response.status}`);
  }

  return await response.json();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const data = await readPublishedPayload();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body ?? {};
      const json = JSON.stringify(body, null, 2);

      await put(PATHNAME, json, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      await put(PATHNAME, JSON.stringify({ payload: null }, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('published-schedule error:', error);
    return res.status(500).json({
      error: 'Published schedule request failed',
      message: error?.message || String(error),
    });
  }
}