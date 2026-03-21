'use client';

import { useEffect, useState } from 'react';

const DEPLOY_STEPS = [
  { text: '$ enclii deploy --prod', color: 'text-gray-400' },
  { text: 'Building container...', color: 'text-blue-400' },
  { text: 'Pushing image (23 MB)...', color: 'text-blue-400' },
  { text: 'Deploying to production...', color: 'text-yellow-400' },
  { text: 'Health check passed', color: 'text-green-400' },
  { text: 'Live at https://app.example.com', color: 'text-green-400' },
];

const PRICING = [
  { name: 'Enclii', price: '$55', detail: '/mo for 12 devs', accent: 'bg-green-500' },
  { name: 'Vercel', price: '~$240', detail: '/mo for 12 devs', accent: 'bg-gray-500' },
  { name: 'AWS', price: '$2K+', detail: '/mo managed', accent: 'bg-orange-500' },
];

export function EncliiTaste() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= DEPLOY_STEPS.length) return;
    const delay = visibleLines === 0 ? 600 : 900;
    const timer = setTimeout(() => setVisibleLines(v => v + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Terminal */}
      <div
        className="rounded-xl overflow-hidden shadow-2xl border border-gray-800"
        role="img"
        aria-label="Animated deploy terminal showing Enclii deployment steps"
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
          <span className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
          <span className="ml-2 text-xs text-gray-400 font-mono">terminal</span>
        </div>
        <div
          className="p-5 font-mono text-sm leading-relaxed min-h-[220px]"
          style={{ background: '#1a1b26' }}
        >
          {DEPLOY_STEPS.map((step, i) => (
            <div
              key={i}
              className={`transition-opacity duration-500 ${
                i < visibleLines ? 'opacity-100' : 'opacity-0'
              } ${step.color}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {i < visibleLines && (
                <>
                  {i === DEPLOY_STEPS.length - 1 && (
                    <span className="text-green-400 mr-1" aria-hidden="true">
                      &#10003;
                    </span>
                  )}
                  {step.text}
                </>
              )}
            </div>
          ))}
          {visibleLines >= DEPLOY_STEPS.length && (
            <div className="mt-3 text-gray-500 animate-pulse">_</div>
          )}
        </div>
      </div>

      {/* Pricing comparison */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly cost for a 12-developer team
        </h3>
        <div className="space-y-4">
          {PRICING.map(item => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{item.name}</span>
                <span>
                  <span className="font-bold text-gray-900 dark:text-white">{item.price}</span>
                  <span className="text-gray-500">{item.detail}</span>
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.accent} transition-all duration-1000 ease-out`}
                  style={{
                    width: item.name === 'Enclii' ? '23%' : item.name === 'Vercel' ? '48%' : '100%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Based on typical production workloads. Your costs may vary.
        </p>
      </div>
    </div>
  );
}
