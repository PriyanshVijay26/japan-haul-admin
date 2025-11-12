import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedProduct } from '@/lib/db/scraped-products';

/**
 * GET /api/featured-product
 * Public endpoint to get the active featured product for homepage display
 */
export async function GET(request: NextRequest) {
    try {
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
