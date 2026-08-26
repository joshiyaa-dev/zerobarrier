// Daily cron endpoint: flags stale postings. Without KV configured this runs
// statelessly and reports what WOULD expire (honest no-op).
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  // Auth guard for manual calls; Vercel Cron sends the CRON_SECRET header automatically.
  const auth = req.headers.authorization;
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}` && !req.headers['x-vercel-cron']) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let expired = 0;
  try {
    const mod = await import('../src/data/jobs.demo.json', { assert: { type: 'json' } });
    const today = new Date().toISOString().slice(0, 10);
    expired = mod.default.jobs.filter((j) => j.posted_date < today).length;
  } catch {
    /* dataset unavailable in edge runtime — fine */
  }

  res.status(200).json({
    ok: true,
    ran_at: new Date().toISOString(),
    kv_configured: Boolean(process.env.KV_REST_API_URL),
    would_expire_without_kv: expired,
    note: 'Stateless mode. Add Vercel KV (KV_REST_API_URL/TOKEN) to persist expiry changes.',
  });
}
