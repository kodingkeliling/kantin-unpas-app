'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to kantin list if no kantin ID in localStorage
    const kantinId = localStorage.getItem('current_kantin_id');
    if (kantinId) {
      router.replace(`/kantin/${kantinId}/checkout`);
    } else {
      router.replace('/kantin');
    }
  }, [router]);
  
  return null;
}
