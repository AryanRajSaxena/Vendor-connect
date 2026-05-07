'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to products since cart has been removed
    router.push('/products');
  }, [router]);

  return null;
}
