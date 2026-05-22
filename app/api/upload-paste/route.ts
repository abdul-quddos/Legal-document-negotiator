import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { fileName, content } = await req.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }
    
    const docId = Date.now().toString();
    const userEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    const finalFileName = fileName || `pasted-${Date.now()}.txt`;
    
    const documentData = {
      id: docId,
      fileName: finalFileName,
      originalText: content,
      editedText: content,
      createdAt: new Date().toISOString(),
    };
    
    await redis.hset(`user:${userEmail}:documents`, {
      [docId]: documentData
    });
    
    return NextResponse.json({ success: true, docId });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }
}