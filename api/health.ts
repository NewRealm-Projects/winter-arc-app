import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health Check Endpoint
 *
 * Simple endpoint to verify backend is running
 * Use: curl https://your-app.vercel.app/api/health
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();

  res.status(200).json({
    status: 'ok',
    service: 'winter-arc-backend',
    timestamp,
    uptime: `${Math.floor(uptime)}s`,
    environment: process.env.NODE_ENV || 'development',
  });
}
