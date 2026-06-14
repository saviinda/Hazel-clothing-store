// Website-specific API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Re-export the shared API client with website-specific configuration
export { websiteApi } from '@hazel/shared';
