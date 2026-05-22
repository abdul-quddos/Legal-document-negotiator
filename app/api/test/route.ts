import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // Get all keys
    const keys = await redis.keys('*');
    
    const results = [];
    for (const key of keys) {
      const type = await redis.type(key);
      let value;
      
      try {
        if (type === 'string') {
          value = await redis.get(key);
        } else if (type === 'hash') {
          value = await redis.hgetall(key);
        } else {
          value = `[${type} type - can't display]`;
        }
      } catch (err: any) {
        value = `Error: ${err.message}`;
      }
      
      results.push({ key, type, value });
    }
    
    return NextResponse.json({ 
      keys: results,
      count: keys.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}