'use client';

import Link from 'next/link';

export type Crop = {
  id: string;
  crop_name: string;
  crop_cycle: string;
  climate: string;
  category?: string;
  image?: string;
  is_active: boolean;
};

type Props = {
  crop: Crop;
};

export default function CropCard({ crop }: Props) {
  return (
    <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-lg transition overflow-hidden">
      {/* Image */}
      <div className="relative h-40 bg-slate-100">
        <img
          src={crop.image || '/images/crop-placeholder.jpg'}
          alt={crop.crop_name}
          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          {crop.crop_name}
        </h3>

        <p className="text-sm text-slate-600">
          🌤️ <span className="font-medium">Climate:</span> {crop.climate}
        </p>

        <p className="text-sm text-slate-600">
          ⏳ <span className="font-medium">Cycle:</span> {crop.crop_cycle}
        </p>

        {/* Redirect Button */}
        <Link href={`/crop-guide/${crop.id}`}>
          <div className="mt-3 text-xs text-green-600 font-semibold cursor-pointer hover:underline">
            View Full Guide →
          </div>
        </Link>
      </div>
    </div>
  );
}
