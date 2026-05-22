import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { redis } from '@/lib/redis';


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    const docJson = await redis.hget(`user:${userEmail}:documents`, id);
    
    if (!docJson) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(docJson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Delete the document
    await redis.hdel(`user:${userEmail}:documents`, id);
    
    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}