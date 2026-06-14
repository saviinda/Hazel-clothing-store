import { NextRequest, NextResponse } from 'next/server';
import { getContent, setContent } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const section_key = searchParams.get('section_key');

    if (!section_key) {
      return NextResponse.json(
        { success: false, error: 'section_key is required' },
        { status: 400 }
      );
    }

    const content = await getContent(section_key);
    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { section_key, data, updated_by } = body;

    if (!section_key || !data || !updated_by) {
      return NextResponse.json(
        { success: false, error: 'section_key, data, and updated_by are required' },
        { status: 400 }
      );
    }

    const content = await setContent(section_key, data, updated_by);
    
    // Log the action
    await createAuditLog({
      admin_id: updated_by,
      action: 'update',
      module: 'content',
      detail: { section_key },
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    );
  }
}
