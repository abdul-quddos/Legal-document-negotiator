import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // Get all keys
    const keys = await redis.keys('*');
    
    // Delete all keys
    for (const key of keys) {
      await redis.del(key);
    }
    
    return NextResponse.json({ 
      message: `Cleaned up ${keys.length} keys`,
      deletedKeys: keys
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}