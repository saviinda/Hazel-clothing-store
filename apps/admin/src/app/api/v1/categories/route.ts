import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updated_by, ...categoryData } = body;

    if (!updated_by) {
      return NextResponse.json(
        { success: false, error: 'updated_by is required' },
        { status: 400 }
      );
    }

    const category = await createCategory(categoryData, updated_by);
    
    // Log the action
    await createAuditLog({
      admin_id: updated_by,
      action: 'create',
      module: 'categories',
      detail: { category_id: category.id, category_name: category.name },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
