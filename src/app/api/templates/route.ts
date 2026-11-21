import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const occasionParam = searchParams.get('occasion');

    const options: { month?: number; occasion?: string } = {};
    if (monthParam) {
      const parsedMonth = parseInt(monthParam, 10);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        options.month = parsedMonth;
      }
    }
    if (occasionParam) {
      options.occasion = occasionParam;
    }

    const templates = await db.getAllTemplates(options);
    return NextResponse.json({ success: true, templates });
  } catch (err) {
    console.error('Failed to retrieve templates:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve templates.' },
      { status: 500 }
    );
  }
}
