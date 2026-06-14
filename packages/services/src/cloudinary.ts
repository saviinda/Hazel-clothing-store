import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export class CloudinaryService {
  private static cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  private static apiKey = process.env.CLOUDINARY_API_KEY || '';

  // 1. Generate Signature for Server-Signed Client Uploads
  static getSignedUploadParams(folder: string, customPublicId?: string) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign: Record<string, any> = {
      timestamp,
      folder,
    };

    if (customPublicId) {
      paramsToSign.public_id = customPublicId;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || ''
    );

    return {
      signature,
      timestamp,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      folder,
      publicId: customPublicId,
    };
  }

  // 2. Generate Expiring Signed URLs for Private Payment Receipts
  static getSignedViewUrl(publicId: string, expiresInMinutes: number = 60): string {
    const expiresAt = Math.round(new Date().getTime() / 1000) + expiresInMinutes * 60;
    
    // In Cloudinary, private/authenticated assets are requested with sign_url=true and type=private/authenticated
    return cloudinary.url(publicId, {
      type: 'private',
      sign_url: true,
      expires_at: expiresAt,
      secure: true,
    });
  }

  // 3. Format/Transform URLs on-the-fly for CDN Delivery
  static optimizeImageUrl(url: string, width: number = 800): string {
    if (!url || !url.includes('cloudinary.com')) {
      return url; // Return as-is if not a Cloudinary asset
    }

    // Cloudinary format: res.cloudinary.com/cloud_name/image/upload/v123456/folder/image.jpg
    // Insert: f_auto,q_auto,w_<width>,c_limit
    const splitToken = '/upload/';
    const parts = url.split(splitToken);
    
    if (parts.length === 2) {
      return `${parts[0]}${splitToken}f_auto,q_auto,w_${width},c_limit/${parts[1]}`;
    }
    
    return url;
  }
}
