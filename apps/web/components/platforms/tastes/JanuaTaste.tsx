'use client';

import { useState } from 'react';

const TABS = ['JavaScript', 'Python', 'Go'] as const;

const CODE_SNIPPETS: Record<(typeof TABS)[number], string[]> = {
  JavaScript: [
    'import { Janua } from "@janua/sdk";',
    '',
    'const janua = new Janua({',
    '  domain: "auth.yourapp.com",',
    '});',
    '',
    'const { user, token } = await janua',
    '  .signIn({ email, password });',
  ],
  Python: [
    'from janua import JanuaClient',
    '',
    'janua = JanuaClient(',
    '    domain="auth.yourapp.com"',
    ')',
    '',
    'result = janua.sign_in(',
    '    email=email, password=password',
    ')',
  ],
  Go: [
    'import "github.com/janua/go-sdk"',
    '',
    'client := janua.NewClient(',
    '  janua.WithDomain("auth.yourapp.com"),',
    ')',
    '',
    'user, token, err := client.',
    '  SignIn(ctx, email, password)',
  ],
};

export function JanuaTaste() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('JavaScript');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Login widget mockup */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 shadow-lg max-w-sm mx-auto w-full">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Sign in
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 flex items-center text-sm text-gray-400">
              user@company.com
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 flex items-center text-sm text-gray-400">
              &#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;
            </div>
          </div>
          <div
            className="h-11 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-medium cursor-default"
            aria-hidden="true"
          >
            Sign in with Passkey
          </div>
          <div className="text-center">
            <span className="text-sm text-purple-600 dark:text-purple-400 cursor-default">
              Continue with SSO
            </span>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <span className="text-xs text-gray-400">
            Powered by <strong>Janua</strong>
          </span>
        </div>
      </div>

      {/* SDK code tabs */}
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
        <div
          className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          role="tablist"
        >
          {TABS.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-900'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div
          className="p-5 font-mono text-sm leading-relaxed bg-white dark:bg-gray-900 min-h-[240px]"
          role="tabpanel"
          aria-label={`${activeTab} code example`}
        >
          {CODE_SNIPPETS[activeTab].map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line === '' ? (
                <br />
              ) : (
                <span
                  className={
                    line.startsWith('import') || line.startsWith('from')
                      ? 'text-purple-500 dark:text-purple-400'
                      : line.includes('//') || line.includes('#')
                        ? 'text-gray-400'
                        : line.includes('"') || line.includes("'")
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-800 dark:text-gray-200'
                  }
                >
                  {line}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
