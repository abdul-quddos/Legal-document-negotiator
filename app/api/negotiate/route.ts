import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { redis } from '@/lib/redis';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId, action, userRequest, documentText, clauseId, originalText, suggestedChange } = await req.json();

    if (action === 'explain') {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a legal document expert. Analyze the document and return a JSON object with this EXACT structure:

{
  "totalClauses": number,
  "highRiskCount": number,
  "mediumRiskCount": number,
  "lowRiskCount": number,
  "clauses": [
    {
      "id": "1.2",
      "title": "License Grant",
      "risk": "high",
      "originalText": "Exact quote from document",
      "plainEnglish": "Simple 1-sentence explanation",
      "whyItMatters": "Real-world impact (1-2 sentences)",
      "suggestedChange": "Specific rewrite suggestion"
    }
  ]
}

Rules:
- Risk levels: "high" (🔴), "medium" (🟡), "low" (🟢)
- Only extract clauses that are legally significant or risky
- Return ONLY valid JSON, no markdown, no other text`
          },
          {
            role: 'user',
            content: `Analyze this contract and return structured JSON:\n\n${documentText.slice(0, 8000)}`
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
      });

      const result = completion.choices[0].message.content;
      let cleanedResult = result || '';
      cleanedResult = cleanedResult.replace(/```json\n?/g, '');
      cleanedResult = cleanedResult.replace(/```\n?/g, '');
      cleanedResult = cleanedResult.trim();
      
      const parsed = JSON.parse(cleanedResult);
      return NextResponse.json(parsed);
    }

    if (action === 'applySuggestion') {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a legal document editor. Rewrite the given clause exactly as requested. Preserve legal tone, formatting, and clause numbering. Return ONLY the rewritten clause text, nothing else. Do not include explanations.'
          },
          {
            role: 'user',
            content: `Original clause:\n${originalText}\n\nUser request: ${suggestedChange}\n\nReturn the rewritten clause only.`
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
      });
      
      const rewrittenClause = completion.choices[0].message.content;
      return NextResponse.json({ rewrittenClause });
    }

    if (action === 'edit') {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a legal document editor. Edit the document exactly as requested. Preserve all formatting, numbering, and legal tone. Only change what the user asks. Return the ENTIRE edited document.'
          },
          {
            role: 'user',
            content: `Original document:\n${documentText}\n\nUser request: ${userRequest}\n\nReturn the complete edited document.`
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
      });

      const editedDocument = completion.choices[0].message.content;

      const userEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
      
      const existingDoc = await redis.hget(`user:${userEmail}:documents`, docId);
      if (existingDoc) {
        const docData = typeof existingDoc === 'string' ? JSON.parse(existingDoc) : existingDoc;
        docData.editedText = editedDocument;
        docData.lastEdited = new Date().toISOString();
        await redis.hset(`user:${userEmail}:documents`, {
          [docId]: docData
        });
      }

      return NextResponse.json({ result: editedDocument });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Negotiation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}       