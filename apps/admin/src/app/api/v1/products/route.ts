import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category_id = searchParams.get('category_id') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const filters: any = {};
    if (category_id) filters.category_id = category_id;
    if (limit) filters.limit = limit;

    const products = await getProducts(filters);
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { created_by, ...productData } = body;

    if (!created_by) {
      return NextResponse.json(
        { success: false, error: 'created_by is required' },
        { status: 400 }
      );
    }

    const product = await createProduct(productData, created_by);
    
    // Log the action
    await createAuditLog({
      admin_id: created_by,
      action: 'create',
      module: 'products',
      detail: { product_id: product.id, product_name: product.name },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
