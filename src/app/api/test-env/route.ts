import { NextResponse } from 'next/server';

export async function GET() {
  // Test environment variables
  const dbUrl = process.env.DATABASE_URL;

  return NextResponse.json({
    database_url_prefix: dbUrl ? dbUrl.substring(0, 50) + '...' : 'NOT FOUND',
    database_url_starts_with: dbUrl?.startsWith('postgresql://') || dbUrl?.startsWith('postgres://'),
    node_env: process.env.NODE_ENV,
    has_database_url: !!dbUrl,
    message: dbUrl ? 'DATABASE_URL is loaded!' : 'DATABASE_URL is NOT loaded!',
  });
}
