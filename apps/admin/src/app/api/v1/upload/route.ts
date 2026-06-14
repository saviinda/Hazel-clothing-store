import { NextResponse } from 'next/server';
import { CloudinaryService } from '@hazel/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const folder = body.folder || 'hazel-clothing/admin';
    const publicId = body.publicId;

    const params = CloudinaryService.getSignedUploadParams(folder, publicId);

    return NextResponse.json(params);
  } catch (error: any) {
    console.error('API Sign Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Signature generation failed.' },
      { status: 500 }
    );
  }
}
