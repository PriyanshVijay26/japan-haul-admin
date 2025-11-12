import { NextRequest, NextResponse } from 'next/server';
import { 
    getFeaturedProduct, 
    saveFeaturedProduct, 
    getAllFeaturedProducts,
    FeaturedProduct 
} from '@/lib/db/scraped-products';

/**
 * GET /api/admin/featured-product
 * Get the active featured product or all featured products
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true';

        if (all) {
            const products = await getAllFeaturedProducts();
            return NextResponse.json({ products });
        }

        const product = await getFeaturedProduct();
        return NextResponse.json({ product });
    } catch (error) {
        console.error('❌ Error fetching featured product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch featured product' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/featured-product
 * Create a new featured product
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            title,
            description,
            price,
            originalPrice,
            discount,
            imageUrl,
            color,
            colorOptions,
            quantityOptions,
            badge,
            buttonText,
            category,
            sourceUrl,
            specifications,
        } = body;

        // Validate required fields
        if (!title || !price || !imageUrl) {
            return NextResponse.json(
                { error: 'Missing required fields: title, price, and imageUrl are required' },
                { status: 400 }
            );
        }

        const productData: Omit<FeaturedProduct, 'id' | 'createdAt' | 'updatedAt'> = {
            title,
            description: description || '',
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            discount: discount ? Number(discount) : undefined,
            imageUrl,
            color,
            colorOptions: colorOptions || [],
            quantityOptions: quantityOptions || [1, 2, 3, 4],
            badge,
            buttonText: buttonText || 'ADD TO CART',
            isActive: true,
            category,
            sourceUrl,
            specifications: specifications || [],
        };

        const productId = await saveFeaturedProduct(productData);

        return NextResponse.json({
            success: true,
            productId,
            message: 'Featured product created successfully',
        });
    } catch (error) {
        console.error('❌ Error creating featured product:', error);
        return NextResponse.json(
            { error: 'Failed to create featured product' },
            { status: 500 }
        );
    }
}
