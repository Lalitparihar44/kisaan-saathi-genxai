// app/crop-guide/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getAllCrops } from '@/lib/crop';
import CropCard, { Crop as CropType } from '@/app/crop-guide/cropcard';

const CATEGORIES = [
  'Vegetable',
  'Fruit',
  'Cereal',
  'Pulse',
  'Oilseed',
  'Spice',
  'Cash Crop',
  'Beverage',
  'Fiber',
  'Plantation',
];

export default function Page() {
  const [crops, setCrops] = useState<CropType[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([
    'Vegetable',
  ]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'A-Z' | 'Z-A'>('A-Z');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  // Fetch crops from API
  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      try {
        const result = await getAllCrops();
        if (result.success && result.data) {
          setCrops(result.data);
        } else {
          console.error('Failed to fetch crops:', result.message);
          setCrops([]); // fallback empty
        }
      } catch (error) {
        console.error('Error fetching crops:', error);
        setCrops([]); // fallback empty
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  // Get categories that exist in fetched crops
  const categoriesUsed = useMemo(() => {
    const used = new Set(crops.map((c) => c.category));
    return CATEGORIES.filter((c) => used.has(c));
  }, [crops]);

  // Summary stats
  const totalCrops = crops.length;

  const totalGuides = useMemo(
    () => crops.filter((c) => c.is_active).length,
    [crops],
  );

  const totalCategories = categoriesUsed.length;

  // Apply filters, search, and sort
  const filteredCrops = useMemo(() => {
    let list = [...crops];

    // ✅ Category filter
    if (
      activeCategories.length > 0 &&
      activeCategories.length !== categoriesUsed.length
    ) {
      list = list.filter(
        (crop) => crop.category && activeCategories.includes(crop.category),
      );
    }

    // ✅ Search filter (case-insensitive)
    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter((crop) =>
        crop.crop_name?.toLowerCase().includes(query),
      );
    }

    // ✅ Safe sorting
    list.sort((a, b) => {
      const nameA = a.crop_name ?? '';
      const nameB = b.crop_name ?? '';
      return sort === 'A-Z'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    return list;
  }, [crops, search, sort, activeCategories, categoriesUsed]);

  function toggleCategory(cat: string) {
    setActiveCategories((prev) => {
      if (prev.includes(cat)) {
        const filtered = prev.filter((p) => p !== cat);
        return filtered.length === 0 ? [...categoriesUsed] : filtered; // fallback to all if none
      } else {
        return [...prev, cat];
      }
    });
  }

  function clearFilters() {
    setActiveCategories([]);
    setSearch('');
    setSort('A-Z');
  }

  return (
    <main className="p-6 lg:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-slate-800 flex items-center gap-3">
              🌾 Crop Guide
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              A knowledge base for farmers — search crops, filter by category,
              and open guides.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border rounded-md px-3 py-2 shadow-sm">
              <button
                onClick={() => {
                  setActiveCategories(['Vegetable']);
                  setView('grid');
                }}
                className="text-sm text-slate-600 hover:text-slate-800"
              >
                Quick Reset
              </button>
            </div>
            <div className="bg-white border rounded-md p-2 flex items-center gap-1 shadow-sm">
              <button
                className={`px-3 py-1 rounded-md text-sm ${view === 'grid' ? 'bg-green-50 text-green-700' : 'text-slate-600'}`}
                onClick={() => setView('grid')}
              >
                ☐ Grid
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${view === 'list' ? 'bg-green-50 text-green-700' : 'text-slate-600'}`}
                onClick={() => setView('list')}
              >
                ☰ List
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Total Crops */}
          <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
            <div className="rounded-full bg-green-50 p-3">🌾</div>
            <div>
              <div className="text-sm font-semibold text-slate-600 tracking-wide">
                Total Crops
              </div>
              <div className="text-xl font-semibold text-slate-800">
                {totalCrops}
              </div>
            </div>
          </div>

          {/* Guides */}
          <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
            <div className="rounded-full bg-blue-50 p-3">📘</div>
            <div>
              <div className="text-sm font-semibold text-slate-600 tracking-wide">
                Guides
              </div>
              <div className="text-xl font-semibold text-slate-800">
                {totalGuides}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
            <div className="rounded-full bg-pink-50 p-3">🗂️</div>
            <div>
              <div className="text-sm font-semibold text-slate-600 tracking-wide">
                Categories
              </div>
              <div className="text-xl font-semibold text-slate-800">
                {totalCategories}
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-slate-600 font-medium">
                Filter by Category:
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveCategories([...categoriesUsed])}
                  className={`px-3 py-1 rounded-full text-sm border font-medium transition-colors duration-200 ${
                    activeCategories.length === categoriesUsed.length
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  All
                </button>

                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm border flex items-center gap-2 ${activeCategories.includes(cat) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-600'}`}
                  >
                    <span className="text-xs">🌱</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search crops..."
                  className="w-64 lg:w-80 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-200"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-2 text-slate-500 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="px-3 py-2 rounded-md border bg-white"
                aria-label="Sort crops"
              >
                <option>A-Z</option>
                <option>Z-A</option>
              </select>
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-md border bg-white text-slate-600"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Showing count */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-slate-600">
            Showing{' '}
            <span className="font-medium text-slate-800">
              {filteredCrops.length}
            </span>{' '}
            of{' '}
            <span className="font-medium text-slate-800">{crops.length}</span>{' '}
            crops
          </div>
          <div className="text-sm text-slate-600">
            Sort: <span className="font-medium">{sort}</span>
          </div>
        </div>

        {/* Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white p-4 rounded-lg border shadow-sm"
              >
                <div className="h-[140px] bg-gray-100 rounded-md mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border text-center text-slate-600">
            No crops found — try different filters or clear search.
          </div>
        ) : (
          <div
            className={`grid ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}
          >
            {filteredCrops.map((crop) => (
              <CropCard key={crop.id} crop={crop} />
            ))}
          </div>
        )}

        <div className="mt-8 text-sm text-slate-500">
          Tip: Click <span className="font-medium">Show Details</span> on any
          crop to view its full guide.
        </div>
      </div>
    </main>
  );
}
