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
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let text = '';
    
    if (file.type === 'text/plain') {
      text = new TextDecoder().decode(bytes);
      console.log("TXT loaded, length:", text.length);
      
    } else if (file.type === 'application/pdf') {
      // Use a different approach - read PDF as raw text fallback
      try {
        // Try to extract using simple text extraction (works for some PDFs)
        const content = buffer.toString('utf-8');
        
        // Look for text between common PDF markers
        const textMatches = content.match(/\(([^)]+)\)/g);
        if (textMatches) {
          text = textMatches
            .map(match => match.slice(1, -1))
            .filter(str => str.length > 3 && !str.match(/^[\d\s\/\(\)\-]+$/))
            .join(' ');
        }
        
        if (text.length < 50) {
          text = `[PDF: ${file.name}]\n\nThis PDF has limited extractable text.

For the best AI analysis, please:
1. Open this PDF in any reader
2. Select all text (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Notepad
5. Save as .txt file
6. Upload the .txt file instead

The AI negotiation tool works perfectly with TXT files.`;
        }
        
        console.log("PDF extracted, length:", text.length);
        
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        text = `❌ PDF Read Error: ${file.name}

Please convert this PDF to TXT:
1. Open the PDF in your browser
2. Press Ctrl+A to select all
3. Press Ctrl+C to copy
4. Open Notepad and press Ctrl+V
5. Save as a .txt file
6. Upload the .txt file

This ensures full AI analysis capability.`;
      }
    } else {
      return NextResponse.json({ error: 'Only PDF and TXT files supported' }, { status: 400 });
    }
    
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
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }
}