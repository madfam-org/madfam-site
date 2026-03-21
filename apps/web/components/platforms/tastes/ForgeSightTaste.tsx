'use client';

import { useEffect, useState } from 'react';

const MATERIALS = [
  { name: 'PLA', range: '$15 - 25', width: 50 },
  { name: 'PETG', range: '$20 - 35', width: 65 },
  { name: 'ABS', range: '$18 - 30', width: 58 },
  { name: 'Resin', range: '$35 - 70', width: 85 },
  { name: 'Nylon', range: '$40 - 80', width: 100 },
];

const BAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
];

export function ForgeSightTaste() {
  const [vendorCount, setVendorCount] = useState(0);
  const targetCount = 1247;

  useEffect(() => {
    if (vendorCount >= targetCount) return;
    const step = Math.max(1, Math.floor((targetCount - vendorCount) / 20));
    const timer = setTimeout(() => setVendorCount(v => Math.min(v + step, targetCount)), 50);
    return () => clearTimeout(timer);
  }, [vendorCount, targetCount]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Bar chart */}
      <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Material Price Index
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Per-kg pricing across tracked vendors (LATAM)
        </p>

        {/* Gridlines + bars */}
        <div className="relative space-y-4">
          {/* Vertical gridlines */}
          <div
            className="absolute inset-0 flex justify-between pointer-events-none"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="border-l border-gray-100 dark:border-gray-800 h-full" />
            ))}
          </div>

          {MATERIALS.map((mat, i) => (
            <div key={mat.name} className="flex items-center gap-3">
              <span className="w-14 text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
                {mat.name}
              </span>
              <div className="flex-1 relative">
                <div className="h-7 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded ${BAR_COLORS[i]} transition-all duration-1000 ease-out flex items-center justify-end pr-2`}
                    style={{ width: `${mat.width}%` }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {mat.range}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor counter card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-lg flex flex-col items-center justify-center text-center min-h-[200px]">
        <div
          className="text-5xl font-bold text-gray-900 dark:text-white tabular-nums"
          aria-live="polite"
          aria-label={`${vendorCount.toLocaleString()} vendors tracked`}
        >
          {vendorCount.toLocaleString()}
          <span className="text-emerald-500">+</span>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">vendors tracked</p>
        <div className="mt-4 flex gap-2">
          {['MX', 'CO', 'BR', 'AR', 'CL'].map(code => (
            <span
              key={code}
              className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium"
            >
              {code}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Updated daily across 5 LATAM markets
        </p>
      </div>
    </div>
  );
}
