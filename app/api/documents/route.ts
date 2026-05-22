import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json([]);
    }

    const userEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    const docs = await redis.hgetall(`user:${userEmail}:documents`);
    
    if (!docs || Object.keys(docs).length === 0) {
      return NextResponse.json([]);
    }
    
    // Directly return the values (they are already objects)
    const documents = Object.values(docs);
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json([]);
  }
}