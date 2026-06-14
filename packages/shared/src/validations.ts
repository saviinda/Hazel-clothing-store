import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(9, 'Phone number must be at least 9 digits').regex(/^[0-9+\s-]+$/, 'Invalid phone number format'),
  street: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  postal_code: z.string().min(4, 'Postal code must be at least 4 digits'),
  payment_method: z.literal('Bank Transfer'),
  payment_proof_url: z.string().url('Invalid payment receipt URL').optional().or(z.literal('')),
});

export const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  price: z.preprocess((val) => Number(val), z.number().min(0, 'Price must be 0 or greater')),
  description: z.string().optional().or(z.literal('')),
  sizes: z.array(z.string()).min(1, 'Select at least one size'),
  colors: z.array(z.string()).min(1, 'Select at least one color'),
  material: z.string().optional().or(z.literal('')),
  stock_qty: z.preprocess((val) => Number(val), z.number().int().min(0, 'Stock must be 0 or greater')),
  category_id: z.string().uuid('Invalid category selection').optional().or(z.literal('')),
  sub_category_id: z.string().uuid('Invalid subcategory selection').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'Upload at least one product image'),
});

export const categoryFormSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  parent_category_id: z.string().uuid('Invalid parent category selection').nullable().optional().or(z.literal('')),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export const inventoryAdjustmentSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  action: z.enum(['add', 'deduct']),
  quantity: z.preprocess((val) => Number(val), z.number().int().positive('Quantity must be greater than 0')),
  reason: z.string().min(3, 'Provide a reason for the adjustment (min 3 chars)'),
});
