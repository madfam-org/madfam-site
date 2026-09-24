'use client';

import { useEffect, useState } from 'react';

// R13/R9 (C-005): the "monthly cost for a 12-developer team" price comparison
// that sat beside this terminal is gone — no hand-typed prices off the
// value-ladder surface, and no infrastructure cost line on public pages.
const DEPLOY_STEPS = [
  { text: '$ enclii deploy --prod', color: 'text-gray-400' },
  { text: 'Building container...', color: 'text-blue-400' },
  { text: 'Pushing image (23 MB)...', color: 'text-blue-400' },
  { text: 'Deploying to production...', color: 'text-yellow-400' },
  { text: 'Health check passed', color: 'text-green-400' },
  { text: 'Live at https://app.example.com', color: 'text-green-400' },
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
    <div className="max-w-2xl mx-auto">
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
    </div>
  );
}
