'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CropSOPDocument from '@/components/layout/CropSOPDocument';
import { getCropById } from '@/lib/crop';

export default function CropSOPPage() {
  const { id } = useParams<{ id: string }>();
  const [crop, setCrop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getCropById(id).then((res) => {
      // ✅ extract actual crop object
      setCrop(res.data[0]);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <p className="text-center mt-10">Loading SOP...</p>;
  }

  if (!crop) {
    return <p className="text-center mt-10">Crop not found</p>;
  }

  return <CropSOPDocument crop={crop} />;
}
