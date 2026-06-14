// Admin-specific API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Re-export the shared API client with admin-specific configuration
export { adminApi } from '@hazel/shared';
