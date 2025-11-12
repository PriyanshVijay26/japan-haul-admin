import { NextRequest, NextResponse } from 'next/server';
import { 
    updateFeaturedProduct, 
    deleteFeaturedProduct,
    FeaturedProduct 
} from '@/lib/db/scraped-products';

/**
 * PUT /api/admin/featured-product/[id]
 * Update a featured product
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const body = await request.json();

        const updates: Partial<FeaturedProduct> = {};

        // Only include provided fields in the update
        if (body.title !== undefined) updates.title = body.title;
        if (body.description !== undefined) updates.description = body.description;
        if (body.price !== undefined) updates.price = Number(body.price);
        if (body.originalPrice !== undefined) updates.originalPrice = Number(body.originalPrice);
        if (body.discount !== undefined) updates.discount = Number(body.discount);
        if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
        if (body.color !== undefined) updates.color = body.color;
        if (body.colorOptions !== undefined) updates.colorOptions = body.colorOptions;
        if (body.quantityOptions !== undefined) updates.quantityOptions = body.quantityOptions;
        if (body.badge !== undefined) updates.badge = body.badge;
        if (body.buttonText !== undefined) updates.buttonText = body.buttonText;
        if (body.isActive !== undefined) updates.isActive = body.isActive;
        if (body.category !== undefined) updates.category = body.category;
        if (body.sourceUrl !== undefined) updates.sourceUrl = body.sourceUrl;
        if (body.specifications !== undefined) updates.specifications = body.specifications;

        await updateFeaturedProduct(resolvedParams.id, updates);

        return NextResponse.json({
            success: true,
            message: 'Featured product updated successfully',
        });
    } catch (error) {
        console.error('❌ Error updating featured product:', error);
        return NextResponse.json(
            { error: 'Failed to update featured product' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/featured-product/[id]
 * Delete a featured product
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        await deleteFeaturedProduct(resolvedParams.id);

        return NextResponse.json({
            success: true,
            message: 'Featured product deleted successfully',
        });
    } catch (error) {
        console.error('❌ Error deleting featured product:', error);
        return NextResponse.json(
            { error: 'Failed to delete featured product' },
            { status: 500 }
        );
    }
}
