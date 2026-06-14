import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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
    const { updated_by, ...productData } = body;

    const product = await updateProduct(id, productData);
    
    // Log the action
    if (updated_by) {
      await createAuditLog({
        admin_id: updated_by,
        action: 'update',
        module: 'products',
        detail: { product_id: product.id, product_name: product.name },
      });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
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
    await deleteProduct(id);
    
    // Log the action
    const body = await request.json();
    if (body.deleted_by) {
      await createAuditLog({
        admin_id: body.deleted_by,
        action: 'delete',
        module: 'products',
        detail: { product_id: id },
      });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
