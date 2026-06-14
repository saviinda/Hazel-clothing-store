import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getProductById } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category_id = searchParams.get('category_id') || undefined;
    const is_featured = searchParams.get('is_featured') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const filters: any = {};
    if (category_id) filters.category_id = category_id;
    if (searchParams.has('is_featured')) filters.is_featured = is_featured;
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
