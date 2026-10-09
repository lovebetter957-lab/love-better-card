const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;
const MAX_UPSTREAM_BYTES = MAX_BASE64_CHARS + 4096;
const UPSTREAM_TIMEOUT_MS = 24000;
const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function sendError(req, res, status, message) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status);
  if (req.method === 'HEAD') return res.end();
  return res.end(JSON.stringify({ ok: false, error: message }));
}

function getUpstreamUrl() {
  // Only the existing Apps Script deployment can supply image bytes.
  const raw = process.env.GAS_URL || '';
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(raw)) {
    return null;
  }
  return new URL(raw);
}

async function readBoundedJson(response) {
  const reader = response.body && response.body.getReader();
  if (!reader) throw new Error('Missing response body');
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_UPSTREAM_BYTES) {
        await reader.cancel();
        throw new Error('Response too large');
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks, length).toString('utf8'));
}

function decodePng(envelope) {
  const data = envelope && envelope.ok === true && envelope.data;
  if (!data || data.contentType !== 'image/png' || typeof data.base64 !== 'string') {
    throw new Error('Invalid image envelope');
  }
  const encoded = data.base64;
  if (!encoded.length || encoded.length > MAX_BASE64_CHARS || encoded.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new Error('Invalid image encoding');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length > MAX_IMAGE_BYTES || bytes.length < PNG_SIGNATURE.length ||
      bytes.toString('base64') !== encoded ||
      !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('Invalid PNG');
  }
  return bytes;
}

async function fetchImageEnvelope(upstreamUrl, signal) {
  const options = {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
    redirect: 'manual',
  };
  let response = await fetch(upstreamUrl.toString(), options);
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location');
    const redirectUrl = location && new URL(location, upstreamUrl);
    // Follow only ContentService's standard redirect. Unexpected locations
    // are rejected before any network request to their destination.
    if (!redirectUrl || redirectUrl.protocol !== 'https:' ||
        redirectUrl.hostname !== 'script.googleusercontent.com' ||
        redirectUrl.pathname !== '/macros/echo' || redirectUrl.port ||
        redirectUrl.username || redirectUrl.password) {
      throw new Error('Invalid upstream redirect');
    }
    if (response.body) await response.body.cancel();
    response = await fetch(redirectUrl.toString(), options);
  }
  return response;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return sendError(req, res, 405, 'Method not allowed');
  }

  // Parse against a constant origin: user-controlled Host is never fetched.
  let requestUrl;
  try {
    requestUrl = new URL(String(req.url || ''), 'https://love-better-card.vercel.app');
  } catch (_) {
    return sendError(req, res, 400, 'Invalid file ID');
  }
  const ids = requestUrl.searchParams.getAll('fileId');
  if (ids.length !== 1 || !FILE_ID_PATTERN.test(ids[0])) {
    return sendError(req, res, 400, 'Invalid file ID');
  }
  const upstreamUrl = getUpstreamUrl();
  if (!upstreamUrl) return sendError(req, res, 503, 'Card image service unavailable');
  upstreamUrl.searchParams.set('action', 'cardImage');
  upstreamUrl.searchParams.set('fileId', ids[0]);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetchImageEnvelope(upstreamUrl, controller.signal);
    // Apps Script ContentService redirects to script.googleusercontent.com.
    // Never pass that redirect, any Google cookies, or its URL to the browser.
    const finalUrl = new URL(response.url || upstreamUrl.toString());
    if (!response.ok || finalUrl.protocol !== 'https:' ||
        !['script.google.com', 'script.googleusercontent.com'].includes(finalUrl.hostname)) {
      throw new Error('Invalid upstream response');
    }
    const contentType = response.headers.get('content-type') || '';
    if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
      throw new Error('Invalid upstream content type');
    }
    const png = decodePng(await readBoundedJson(response));
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', String(png.length));
    res.setHeader('Content-Disposition', 'inline; filename="point-card.png"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=3600');
    res.status(200);
    return req.method === 'HEAD' ? res.end() : res.end(png);
  } catch (_) {
    return sendError(req, res, controller.signal.aborted ? 504 : 502, 'Unable to load card image');
  } finally {
    clearTimeout(timeout);
  }
};
