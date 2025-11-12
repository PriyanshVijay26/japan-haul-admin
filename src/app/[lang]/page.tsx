"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, use } from "react";
import { useCart } from "@/app/(cart)/CartContext";
import HeroCarousel from "@/app/_components/HeroCarousel";
import { getAllProducts, type Product } from "@/app/_data/products";

interface FeaturedProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    imageUrl: string;
    color?: string;
    colorOptions?: string[];
    quantityOptions?: number[];
    badge?: string;
    buttonText?: string;
}

export default function LocalizedHome({ params }: { params: Promise<{ lang: string }> }) {
    // Unwrap params Promise for Next.js 15
    const resolvedParams = use(params);

    // Debug logging to see what's in params
    console.log('🔍 Debug params:', resolvedParams);
    console.log('🔍 Debug params.lang:', resolvedParams?.lang, typeof resolvedParams?.lang);

    // Handle different possible param structures in Next.js 15
    let langParam = resolvedParams?.lang;

    // Handle case where lang might be an object with a value property
    if (typeof langParam === 'object' && langParam !== null && 'value' in langParam) {
        langParam = (langParam as { value: string }).value;
    }

    // Ensure lang is a valid string
    const lang = (typeof langParam === 'string' && (langParam === "ja" || langParam === "en"))
        ? langParam
        : "en";

    console.log('🔍 Final lang value:', lang, typeof lang);

    // State for products - start with empty array and show loading
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [featuredProduct, setFeaturedProduct] = useState<FeaturedProduct | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const { dispatch } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('🔄 Fetching data for home page...');
                setIsLoading(true);

                // Fetch featured product
                const featuredResponse = await fetch('/api/featured-product');
                const featuredData = await featuredResponse.json();
                if (featuredData.product) {
                    setFeaturedProduct(featuredData.product);
                    setSelectedColor(featuredData.product.color || featuredData.product.colorOptions?.[0] || "");
                    setSelectedQuantity(featuredData.product.quantityOptions?.[0] || 1);
                }

                // Fetch products
                const realProducts = await getAllProducts(16);
                console.log('✅ Received real products:', realProducts.length);
                setProducts(realProducts);
                console.log('✅ Updated home page with real products');
            } catch (error) {
                console.error('❌ Failed to fetch data for home page:', error);
                // Keep empty array - show loading skeleton or empty state
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Add to cart button component (uses CartContext and opens drawer + toast)
    function AddToCartButton({
        featuredProduct,
        selectedQuantity,
    }: {
        featuredProduct: FeaturedProduct;
        selectedQuantity: number;
    }) {
        const handleAdd = () => {
            if (!dispatch) {
                setToastMessage('Cart not available');
                setTimeout(() => setToastMessage(null), 2500);
                return;
            }

            dispatch({
                type: 'add',
                item: {
                    id: featuredProduct.id,
                    title: featuredProduct.title,
                    price: featuredProduct.price,
                    image: featuredProduct.imageUrl,
                },
                quantity: selectedQuantity,
            });

            // Open cart drawer via global event (Header listens for this)
            try {
                const ev = new CustomEvent('cart:open');
                window.dispatchEvent(ev);
                document.dispatchEvent(ev);
            } catch (e) {
                // ignore
            }

            // Show non-blocking toast
            setToastMessage(`${featuredProduct.title} — added to cart (${selectedQuantity}x)`);
            setTimeout(() => setToastMessage(null), 2500);
        };

        return (
            <button onClick={handleAdd} className="w-full bg-black text-white font-bold text-lg py-4 rounded-lg hover:bg-gray-800 transition-colors mb-3">
                {featuredProduct.buttonText || 'ADD TO CART'}
            </button>
        );
    }

    return (
        <section>
            {/* Hero Carousel */}
            {/* <div className="w-full px-6 lg:px-10 py-8 mb-6">
                <HeroCarousel lang={lang} />
            </div> */}

            {/* Featured Product Hero Section */}
            {featuredProduct && (
                <div className="w-full px-6 lg:px-10 py-8 mb-6">
                    <div className="relative bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl overflow-hidden shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 lg:p-12">
                            {/* Left: Product Image */}
                            <div className="relative">
                                {/* Badge */}
                                {featuredProduct.badge && (
                                    <div className="absolute top-0 right-0 z-10">
                                        <div className="bg-red-500 text-white font-bold px-6 py-3 transform rotate-12 shadow-lg">
                                            {featuredProduct.badge}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Main Image */}
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-md">
                                    <Image
                                        src={featuredProduct.imageUrl}
                                        alt={featuredProduct.title}
                                        fill
                                        className="object-contain p-8"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Right: Product Details */}
                            <div className="flex flex-col justify-center">
                                <div className="mb-4">
                                    <h2 className="text-4xl font-bold mb-2">{featuredProduct.title}</h2>
                                    <p className="text-gray-600 text-lg">{featuredProduct.description}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-5xl font-bold text-gray-900">
                                            ¥{featuredProduct.price.toLocaleString()}
                                        </span>
                                        {featuredProduct.originalPrice && (
                                            <>
                                                <span className="text-2xl text-gray-500 line-through">
                                                    ¥{featuredProduct.originalPrice.toLocaleString()}
                                                </span>
                                                {featuredProduct.discount && (
                                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                        SAVE {featuredProduct.discount}%
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Color Options */}
                                {featuredProduct.colorOptions && featuredProduct.colorOptions.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold mb-3">Color</h3>
                                        <div className="flex gap-2">
                                            {featuredProduct.colorOptions.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`px-6 py-2 rounded-lg border-2 transition-all ${
                                                        selectedColor === color
                                                            ? "border-black bg-black text-white"
                                                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                                                    }`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Options */}
                                {featuredProduct.quantityOptions && featuredProduct.quantityOptions.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold mb-3">Quantity</h3>
                                        <div className="flex gap-2">
                                            {featuredProduct.quantityOptions.map((qty) => (
                                                <button
                                                    key={qty}
                                                    onClick={() => setSelectedQuantity(qty)}
                                                    className={`px-6 py-2 rounded-lg border-2 transition-all font-semibold ${
                                                        selectedQuantity === qty
                                                            ? "border-black bg-black text-white"
                                                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                                                    }`}
                                                >
                                                    {qty}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CTA Button */}
                                <div>
                                    <AddToCartButton
                                        featuredProduct={featuredProduct}
                                        selectedQuantity={selectedQuantity}
                                    />
                                    {/* "view full details" removed per request */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product grid with SSR data + client-side fallback */}
            <div className="w-full px-6 lg:px-10 py-8">

                {/* Toast notification */}
                {toastMessage && (
                    <div className="fixed right-6 top-20 z-[2000] w-auto max-w-sm">
                        <div className="rounded-lg bg-black text-white px-4 py-3 shadow-lg">
                            {toastMessage}
                        </div>
                    </div>
                )}
                {isLoading ? (
                    // Loading skeleton
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <Link key={product.id} href={`/${lang}/products/${product.id}`} className="group block">
                                <div className="aspect-square overflow-hidden rounded-lg border bg-white group-hover:shadow-sm transition">
                                    <Image
                                        src={product.imageUrl || "/placeholder.jpg"}
                                        alt={product.title || "Product"}
                                        width={600}
                                        height={600}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="mt-2 text-sm leading-tight">
                                    <div className="font-bold group-hover:underline line-clamp-2">{product.title}</div>
                                    <div className="mt-0.5 text-[13px]">
                                        <span className="font-semibold text-black">¥{product.price.toLocaleString()} JPY</span>
                                        {product.compareAt && (
                                            <span className="ml-2 text-gray-500 line-through text-xs">
                                                ¥{product.compareAt.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    {product.availability === 'out' && (
                                        <div className="mt-1 text-xs text-red-600 font-medium">Out of Stock</div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">No products available</div>
                        <Link href={`/${lang}/products`} className="text-blue-600 hover:text-blue-800 font-medium">
                            View all products →
                        </Link>
                    </div>
                )}
            </div>

            {/* Client-side fallback script */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        if (typeof window !== 'undefined' && document.querySelector('.grid')) {
                            const productsGrid = document.querySelector('.grid');
                            if (productsGrid && productsGrid.children.length === 0) {
                                console.log('🔄 Client-side: No products found, attempting fallback...');
                                fetch('/api/products/db?limit=8&lang=${lang}')
                                    .then(response => response.json())
                                    .then(data => {
                                        if (data.products && data.products.length > 0) {
                                            console.log('✅ Client-side: Found products, would update DOM');
                                            // In a real implementation, you would update the DOM here
                                        }
                                    })
                                    .catch(error => console.error('❌ Client-side fallback failed:', error));
                            }
                        }
                    `
                }}
            />
        </section>
    );
}
