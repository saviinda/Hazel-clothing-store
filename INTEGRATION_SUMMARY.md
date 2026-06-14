# Hazel Clothing Store - Integration Summary

This document summarizes the complete integration of frontend and backend services including Brevo, Cloudinary, Supabase, and the connection between admin and website applications.

## Architecture Overview

```
┌─────────────────┐
│   Website App   │ (Port 3000)
│  (Next.js 16)   │
└────────┬────────┘
         │
         ├── API Routes (/api/v1/*)
         │   ├── Products (GET)
         │   ├── Categories (GET)
         │   ├── Orders (POST, GET)
         │   └── Upload (POST - Cloudinary signatures)
         │
┌────────▼────────┐
│  Shared Package │
│  - Types        │
│  - Validations  │
│  - API Client   │
└────────┬────────┘
         │
┌────────▼────────┐
│ Database Package│
│  - Supabase     │
│  - Queries      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Services Package │
│  - Brevo (Email) │
│  - Cloudinary   │
│  - Payment      │
│  - Pixel        │
└────────┬────────┘
         │
┌────────▼────────┐
│   Supabase DB   │
│  - PostgreSQL   │
│  - Auth         │
│  - Storage      │
└─────────────────┘

┌─────────────────┐
│   Admin App     │ (Port 3001)
│  (Next.js 16)   │
└────────┬────────┘
         │
         ├── API Routes (/api/v1/*)
         │   ├── Products (CRUD)
         │   ├── Categories (CRUD)
         │   ├── Orders (GET, PUT)
         │   ├── Inventory (GET, POST)
         │   ├── Content (GET, PUT)
         │   └── Upload (POST - Cloudinary signatures)
         │
         └── Same Shared/Database/Services packages
```

## Service Integrations

### 1. Supabase (Database & Auth)

**Configuration:**
- Database package: `packages/database/src/supabase.ts`
- Schema: `packages/database/schema.sql`
- Query functions: `packages/database/src/queries.ts`

**Features:**
- User authentication via Supabase Auth
- Row Level Security (RLS) policies for data protection
- Automatic stock management via database triggers
- Full CRUD operations for all entities

**Tables:**
- `users` - Admin users linked to Supabase Auth
- `categories` - Product categories with hierarchy
- `products` - Product catalog with variants
- `customers` - Customer information
- `orders` - Order management with status tracking
- `inventory_logs` - Stock adjustment history
- `content` - CMS for banners and text
- `notifications` - Email queue log
- `audit_logs` - Admin action tracking

### 2. Brevo (Email Service)

**Configuration:**
- Service: `packages/services/src/brevo.ts`
- Environment variables: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, etc.

**Email Types:**
1. **Order Confirmation** - Sent to customer after order placement
2. **Payment Verification** - Sent when payment is verified/rejected
3. **Shipping Update** - Sent when order is shipped with tracking
4. **Admin Alert** - Sent to admin when new order is placed

**Integration Points:**
- Website order creation API (`apps/website/src/app/api/v1/orders/route.ts`)
- Admin order status update API (`apps/admin/src/app/api/v1/orders/[id]/route.ts`)

### 3. Cloudinary (Image Storage)

**Configuration:**
- Service: `packages/services/src/cloudinary.ts`
- Environment variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Features:**
- Server-signed upload parameters for secure uploads
- Expiring signed URLs for private payment receipts
- Image optimization via CDN transformations

**Integration Points:**
- Website upload API (`apps/website/src/app/api/v1/upload/route.ts`)
- Admin upload API (`apps/admin/src/app/api/v1/upload/route.ts`)

**Upload Folders:**
- `hazel-clothing/products` - Product images
- `hazel-clothing/payment-proofs` - Payment receipts
- `hazel-clothing/admin` - Admin uploads

### 4. Admin ↔ Website Data Connection

**Shared Database:**
Both apps connect to the same Supabase database, ensuring real-time data synchronization.

**Shared Packages:**
- `@hazel/shared` - Types, validations, API client
- `@hazel/database` - Supabase client, query functions
- `@hazel/services` - Brevo, Cloudinary, Payment, Pixel services

**Data Flow:**
```
Website (Customer) → Creates Order → Supabase → Admin (Staff) → Updates Status → Email (Brevo)
```

## API Endpoints

### Website API (Port 3000)

**Products:**
- `GET /api/v1/products` - List products (with filters)
- `GET /api/v1/products/[id]` - Get single product

**Categories:**
- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/[id]` - Get single category

**Orders:**
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/[id]` - Get order details
- `PUT /api/v1/orders/[id]/payment-proof` - Upload payment receipt

**Upload:**
- `POST /api/v1/upload` - Get Cloudinary upload signature

### Admin API (Port 3001)

**Products:**
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/[id]` - Get single product
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/[id]` - Update product
- `DELETE /api/v1/products/[id]` - Delete product

**Categories:**
- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/[id]` - Get single category
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/[id]` - Update category
- `DELETE /api/v1/categories/[id]` - Delete category

**Orders:**
- `GET /api/v1/orders` - List orders (with filters)
- `GET /api/v1/orders/[id]` - Get order details
- `PUT /api/v1/orders/[id]` - Update order status/shipping

**Inventory:**
- `GET /api/v1/inventory` - Get inventory logs
- `POST /api/v1/inventory` - Adjust inventory

**Content:**
- `GET /api/v1/content` - Get content section
- `PUT /api/v1/content` - Update content section

**Upload:**
- `POST /api/v1/upload` - Get Cloudinary upload signature

## Frontend Integration

### Website App

**Hooks:**
- `useProducts()` - Fetch products with filters
- `useProduct(id)` - Fetch single product
- `useCategories()` - Fetch categories

**API Client:**
- `websiteApi` - Pre-configured API client for website

### Admin App

**Hooks:**
- `useAdminProducts()` - Fetch products
- `useAdminProduct(id)` - Fetch single product
- `useProductMutations()` - CRUD operations for products
- `useAdminOrders()` - Fetch orders
- `useAdminOrder(id)` - Fetch single order
- `useOrderMutations()` - Update order status/shipping

**API Client:**
- `adminApi` - Pre-configured API client for admin

## Environment Variables

See `ENV_SETUP.md` for complete environment variable setup guide.

## Running the Applications

### Development

```bash
# Install dependencies
npm install

# Run website (port 3000)
npm run dev:website

# Run admin (port 3001)
npm run dev:admin
```

### Build

```bash
# Build website
npm run build:website

# Build admin
npm run build:admin
```

## Testing the Integration

### 1. Test Database Connection
```bash
# Access products endpoint
curl http://localhost:3000/api/v1/products
```

### 2. Test Email Service
- Place an order through the website
- Check email inbox for confirmation
- Check admin email for new order alert

### 3. Test Cloudinary Upload
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -H "Content-Type: application/json" \
  -d '{"folder":"test","publicId":"test-image"}'
```

### 4. Test Admin-Website Connection
1. Create product in admin
2. View product on website
3. Place order on website
4. View order in admin
5. Update order status in admin
6. Check email notifications

## Security Considerations

1. **Row Level Security (RLS)** - Enabled on all Supabase tables
2. **Service Role Key** - Only used in admin app for privileged operations
3. **API Secrets** - Never exposed to client-side code
4. **Signed Uploads** - Cloudinary uploads use server-side signatures
5. **Audit Logging** - All admin actions are logged

## Next Steps

1. Set up environment variables (see `ENV_SETUP.md`)
2. Run the database schema in Supabase
3. Configure Brevo sender email
4. Set up Cloudinary upload presets
5. Test the complete flow from order placement to delivery
