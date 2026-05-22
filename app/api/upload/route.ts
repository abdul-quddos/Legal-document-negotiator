import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (file.type !== 'text/plain') {
      return NextResponse.json({ 
        error: 'Please upload a .txt file or use the "Paste Text" option' 
      }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const text = new TextDecoder().decode(bytes);
    
    const docId = Date.now().toString();
    const userEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    
    const documentData = {
      id: docId,
      fileName: file.name,
      originalText: text,
      editedText: text,
      createdAt: new Date().toISOString(),
    };
    
    await redis.hset(`user:${userEmail}:documents`, {
      [docId]: documentData
    });
    
    return NextResponse.json({ success: true, docId });
    
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}