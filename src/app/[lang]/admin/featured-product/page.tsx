"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";

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
    isActive: boolean;
    category?: string;
    sourceUrl?: string;
    specifications?: string[];
}

export default function FeaturedProductPage() {
    const router = useRouter();
    const { lang: rawLang } = useParams<{ lang: string }>();
    const lang = rawLang === "ja" ? "ja" : "en";
    
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [products, setProducts] = useState<FeaturedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<FeaturedProduct | null>(null);
    
    // Check authentication on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const response = await fetch('/api/admin/check-access', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uid: user.uid, email: user.email }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setIsAuthenticated(data.hasAccess);
                    } else {
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('Error checking admin access:', error);
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        originalPrice: "",
        discount: "",
        imageUrl: "",
        color: "",
        colorOptions: "",
        quantityOptions: "1,2,3,4",
        badge: "",
        buttonText: "ADD TO CART",
        category: "",
        sourceUrl: "",
        specifications: "",
    });

    useEffect(() => {
        if (isAuthenticated) {
            fetchProducts();
        }
    }, [isAuthenticated]);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/admin/featured-product?all=true");
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error("Error fetching featured products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
                discount: formData.discount ? Number(formData.discount) : undefined,
                colorOptions: formData.colorOptions ? formData.colorOptions.split(",").map(c => c.trim()) : [],
                quantityOptions: formData.quantityOptions ? formData.quantityOptions.split(",").map(n => Number(n.trim())) : [1, 2, 3, 4],
                specifications: formData.specifications ? formData.specifications.split("\n").filter(s => s.trim()) : [],
            };

            if (editingProduct) {
                // Update existing product
                const response = await fetch(`/api/admin/featured-product/${editingProduct.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) throw new Error("Failed to update product");
            } else {
                // Create new product
                const response = await fetch("/api/admin/featured-product", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) throw new Error("Failed to create product");
            }

            // Reset form and refresh
            setFormData({
                title: "",
                description: "",
                price: "",
                originalPrice: "",
                discount: "",
                imageUrl: "",
                color: "",
                colorOptions: "",
                quantityOptions: "1,2,3,4",
                badge: "",
                buttonText: "ADD TO CART",
                category: "",
                sourceUrl: "",
                specifications: "",
            });
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts();

            alert(editingProduct ? "Featured product updated!" : "Featured product created!");
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product");
        }
    };

    const handleEdit = (product: FeaturedProduct) => {
        setEditingProduct(product);
        setFormData({
            title: product.title,
            description: product.description,
            price: product.price.toString(),
            originalPrice: product.originalPrice?.toString() || "",
            discount: product.discount?.toString() || "",
            imageUrl: product.imageUrl,
            color: product.color || "",
            colorOptions: product.colorOptions?.join(", ") || "",
            quantityOptions: product.quantityOptions?.join(", ") || "1,2,3,4",
            badge: product.badge || "",
            buttonText: product.buttonText || "ADD TO CART",
            category: product.category || "",
            sourceUrl: product.sourceUrl || "",
            specifications: product.specifications?.join("\n") || "",
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this featured product?")) return;

        try {
            const response = await fetch(`/api/admin/featured-product/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete product");

            fetchProducts();
            alert("Featured product deleted!");
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product");
        }
    };

    const handleToggleActive = async (product: FeaturedProduct) => {
        try {
            const response = await fetch(`/api/admin/featured-product/${product.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !product.isActive }),
            });

            if (!response.ok) throw new Error("Failed to toggle active status");

            fetchProducts();
        } catch (error) {
            console.error("Error toggling active status:", error);
            alert("Failed to toggle active status");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.href = `/${lang}/admin/login`;
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        You do not have permission to access this page.
                    </p>
                    <Link
                        href={`/${lang}/admin/login`}
                        className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Navigation */}
            <header className="bg-white shadow mb-6">
                <div className="w-full px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">Featured Product Management</h1>
                            <div className="flex space-x-2">
                                <Link
                                    href={`/${lang}/admin/products`}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                                >
                                    📦 Products
                                </Link>
                                <Link
                                    href={`/${lang}/admin/purchases`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                >
                                    📋 Purchases
                                </Link>
                                <Link
                                    href={`/${lang}/admin/analytics`}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                                >
                                    📊 Analytics
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href={`/${lang}`} className="text-gray-600 hover:text-gray-900 text-sm">
                                View Site
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Manage Featured Products</h2>
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            setEditingProduct(null);
                            setFormData({
                                title: "",
                                description: "",
                                price: "",
                                originalPrice: "",
                                discount: "",
                                imageUrl: "",
                                color: "",
                                colorOptions: "",
                                quantityOptions: "1,2,3,4",
                                badge: "",
                                buttonText: "ADD TO CART",
                                category: "",
                                sourceUrl: "",
                                specifications: "",
                            });
                        }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        {showForm ? "Cancel" : "Add New Featured Product"}
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingProduct ? "Edit Featured Product" : "Create New Featured Product"}
                        </h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL *</label>
                                <input
                                    type="url"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Price (JPY) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Original Price (JPY)</label>
                                <input
                                    type="number"
                                    name="originalPrice"
                                    value={formData.originalPrice}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Discount (%)</label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Badge Text</label>
                                <input
                                    type="text"
                                    name="badge"
                                    value={formData.badge}
                                    onChange={handleInputChange}
                                    placeholder="e.g., HOLIDAY HUGE SALE!"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Default Color</label>
                                <input
                                    type="text"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Shaded"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Color Options (comma-separated)</label>
                                <input
                                    type="text"
                                    name="colorOptions"
                                    value={formData.colorOptions}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Shaded, Cream"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Quantity Options (comma-separated)</label>
                                <input
                                    type="text"
                                    name="quantityOptions"
                                    value={formData.quantityOptions}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 1,2,3,4"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Button Text</label>
                                <input
                                    type="text"
                                    name="buttonText"
                                    value={formData.buttonText}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Source URL</label>
                                <input
                                    type="url"
                                    name="sourceUrl"
                                    value={formData.sourceUrl}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Specifications (one per line)</label>
                                <textarea
                                    name="specifications"
                                    value={formData.specifications}
                                    onChange={handleInputChange}
                                    rows={4}
                                    placeholder="Enter each specification on a new line"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="col-span-2">
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                >
                                    {editingProduct ? "Update Product" : "Create Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Products List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                            <p className="mt-2 text-gray-600">Loading products...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <p className="text-gray-600 text-center py-12">No featured products yet. Create one above!</p>
                    ) : (
                        <div className="grid gap-4">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className={`border rounded-lg p-4 flex gap-4 ${
                                        product.isActive ? "bg-green-50 border-green-200" : "bg-gray-50"
                                    }`}
                                >
                                    <div className="w-32 h-32 relative flex-shrink-0">
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.title}
                                            fill
                                            className="object-cover rounded"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold">{product.title}</h3>
                                                <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                                                <div className="mt-2">
                                                    <span className="text-xl font-bold">¥{product.price.toLocaleString()}</span>
                                                    {product.originalPrice && (
                                                        <span className="ml-2 text-gray-500 line-through">
                                                            ¥{product.originalPrice.toLocaleString()}
                                                        </span>
                                                    )}
                                                    {product.discount && (
                                                        <span className="ml-2 text-red-600 font-semibold">
                                                            SAVE {product.discount}%
                                                        </span>
                                                    )}
                                                </div>
                                                {product.badge && (
                                                    <span className="inline-block mt-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                        {product.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(product)}
                                                    className={`px-3 py-1 rounded text-sm ${
                                                        product.isActive
                                                            ? "bg-green-600 text-white"
                                                            : "bg-gray-400 text-white"
                                                    }`}
                                                >
                                                    {product.isActive ? "Active" : "Inactive"}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}