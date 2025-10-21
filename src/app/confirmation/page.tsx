"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConfirmationRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Redirect to English confirmation page with all query parameters
        const params = searchParams.toString();
        const redirectUrl = `/en/confirmation${params ? `?${params}` : ''}`;
        router.replace(redirectUrl);
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-600">Redirecting to confirmation page...</p>
            </div>
        </div>
    );
}
