// Vercel serverless function: serves the job dataset as JSON.
// Lets external partners/tools query listings without the SPA.
import jobs from '../src/data/jobs.demo.json' assert { type: 'json' };

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { district, category, limit } = req.query;
  let data = jobs.jobs;
  if (district) data = data.filter((j) => j.district.toLowerCase() === String(district).toLowerCase());
  if (category) data = data.filter((j) => j.category.toLowerCase() === String(category).toLowerCase());
  const max = Math.min(Number(limit) || 50, 200);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).json({
    meta: jobs.meta,
    count: data.length,
    note: jobs.meta?.note ?? 'Synthetic demonstration dataset — not real employer listings.',
    jobs: data.slice(0, max),
  });
}
