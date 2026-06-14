# Environment Variables Setup Guide

This document outlines all the environment variables needed for the Hazel Clothing Store project.

## Required Environment Variables

### Supabase (Database & Auth)
Both apps need these variables for Supabase connection:

```bash
# For both website and admin apps
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Only for admin
```

### Brevo (Email Service)
Required for sending order confirmation, payment verification, and shipping update emails:

```bash
# For both website and admin apps
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@hazelclothing.lk
BREVO_SENDER_NAME=Hazel Clothing
BREVO_ADMIN_EMAIL=hazeladmin@hazelclothing.lk
```

### Cloudinary (Image Storage)
Required for product images and payment proof uploads:

```bash
# For both website and admin apps
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Admin URL
Required for email links to admin panel:

```bash
# For both website and admin apps
ADMIN_URL=http://localhost:3001  # Update with production URL
```

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL schema from `packages/database/schema.sql` in your Supabase SQL editor
3. Go to Project Settings > API to get your:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)
4. Enable Row Level Security (RLS) policies are already defined in the schema

### 2. Brevo Setup
1. Go to [brevo.com](https://www.brevo.com) and create an account
2. Go to SMTP & API settings to generate your API key
3. Verify your sender email address in Brevo settings
4. Configure transactional email templates if needed

### 3. Cloudinary Setup
1. Go to [cloudinary.com](https://cloudinary.com) and create an account
2. Create a new cloud (or use existing)
3. Go to Dashboard > Account Details to get:
   - Cloud name
   - API key
   - API secret (keep this secret!)
4. Create upload presets for:
   - `hazel-clothing/products` (for product images)
   - `hazel-clothing/payment-proofs` (for payment receipts)
   - `hazel-clothing/admin` (for admin uploads)

### 4. Environment Files

Create `.env.local` files in both apps:

**Website App (`apps/website/.env.local`):**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@hazelclothing.lk
BREVO_SENDER_NAME=Hazel Clothing
BREVO_ADMIN_EMAIL=hazeladmin@hazelclothing.lk
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ADMIN_URL=http://localhost:3001
```

**Admin App (`apps/admin/.env.local`):**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@hazelclothing.lk
BREVO_SENDER_NAME=Hazel Clothing
BREVO_ADMIN_EMAIL=hazeladmin@hazelclothing.lk
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ADMIN_URL=http://localhost:3001
```

## Security Notes

- **Never commit `.env.local` files** to version control
- **Service role keys** should only be used on the server-side (admin app)
- **API secrets** should never be exposed to the client
- Use different API keys for development and production environments

## Testing the Setup

After setting up environment variables:

1. **Test Supabase Connection:**
   ```bash
   cd apps/website
   npm run dev
   # Visit http://localhost:3000/api/v1/products
   ```

2. **Test Cloudinary Upload:**
   ```bash
   # Test the upload signature endpoint
   curl -X POST http://localhost:3000/api/v1/upload \
     -H "Content-Type: application/json" \
     -d '{"folder":"test","publicId":"test-image"}'
   ```

3. **Test Email Service:**
   - Place a test order through the website
   - Check if confirmation emails are sent
   - Check admin email for new order alerts

## Troubleshooting

### Supabase Connection Issues
- Verify your project URL and keys are correct
- Check that RLS policies are properly set up
- Ensure your IP is not blocked (if using IP restrictions)

### Cloudinary Upload Issues
- Verify your cloud name, API key, and secret are correct
- Check that upload presets are configured correctly
- Ensure folder names match your Cloudinary setup

### Brevo Email Issues
- Verify your API key is valid
- Check that sender email is verified in Brevo
- Review email sending limits and quotas
- Check Brevo dashboard for delivery status

### Database Schema Issues
- Ensure you've run the complete schema.sql file
- Check that all tables and indexes are created
- Verify RLS policies are enabled
