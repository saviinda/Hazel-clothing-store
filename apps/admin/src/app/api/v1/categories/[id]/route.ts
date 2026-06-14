import { NextRequest, NextResponse } from 'next/server';
import { getCategoryById, updateCategory, deleteCategory } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await getCategoryById(id);
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { updated_by, ...categoryData } = body;

    const category = await updateCategory(id, categoryData, updated_by);
    
    // Log the action
    await createAuditLog({
      admin_id: updated_by,
      action: 'update',
      module: 'categories',
      detail: { category_id: category.id, category_name: category.name },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCategory(id);
    
    // Log the action
    const body = await request.json();
    if (body.deleted_by) {
      await createAuditLog({
        admin_id: body.deleted_by,
        action: 'delete',
        module: 'categories',
        detail: { category_id: id },
      });
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
