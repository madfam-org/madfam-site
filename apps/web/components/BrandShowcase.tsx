'use client';

import React, { useState } from 'react';
import { LogoSystem, LoadingLogo, LogoWithTagline, Button } from '@/components/ui';

export const BrandShowcase: React.FC = () => {
  const [activeVariant, setActiveVariant] = useState<'full' | 'icon' | 'wordmark'>('full');
  const [activeSize, setActiveSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [activeColorMode, setActiveColorMode] = useState<'color' | 'mono' | 'white'>('color');

  return (
    <section className="py-24 bg-gradient-to-b from-surface/50 to-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-green via-brand-purple to-brand-yellow bg-clip-text text-transparent">
            Our Brand Evolution
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From solarpunk creative agency to enterprise-ready platform, our identity evolves while
            preserving our creative DNA.
          </p>
        </div>

        {/* Interactive Logo Showcase */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface/50 backdrop-blur-sm rounded-3xl p-12 border border-brand-purple/20">
            {/* Logo Display Area */}
            <div className="flex justify-center items-center min-h-[200px] mb-12 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-green/5 via-brand-purple/5 to-brand-yellow/5 rounded-2xl" />

              <div className="relative z-10">
                {activeVariant === 'full' && (
                  <LogoWithTagline
                    variant={activeVariant}
                    size={activeSize}
                    colorMode={activeColorMode}
                    animated
                  />
                )}
                {activeVariant !== 'full' && (
                  <LogoSystem
                    variant={activeVariant}
                    size={activeSize}
                    colorMode={activeColorMode}
                    animated
                  />
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Variant Selector */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Variant
                </label>
                <div className="flex gap-2">
                  {(['full', 'icon', 'wordmark'] as const).map(variant => (
                    <Button
                      key={variant}
                      variant={activeVariant === variant ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveVariant(variant)}
                      className={
                        activeVariant === variant
                          ? 'bg-gradient-to-r from-brand-green to-brand-purple text-white'
                          : ''
                      }
                    >
                      {variant}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Size</label>
                <div className="flex gap-2 flex-wrap">
                  {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
                    <Button
                      key={size}
                      variant={activeSize === size ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSize(size)}
                      className={
                        activeSize === size
                          ? 'bg-gradient-to-r from-brand-purple to-brand-yellow text-white'
                          : ''
                      }
                    >
                      {size.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Mode Selector */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Color Mode
                </label>
                <div className="flex gap-2">
                  {(['color', 'mono', 'white'] as const).map(mode => (
                    <Button
                      key={mode}
                      variant={activeColorMode === mode ? 'creative' : 'outline'}
                      size="sm"
                      onClick={() => setActiveColorMode(mode)}
                      className={
                        activeColorMode === mode
                          ? 'bg-gradient-to-r from-brand-yellow to-brand-green text-white'
                          : ''
                      }
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading State Demo */}
            <div className="mt-8 pt-8 border-t border-brand-purple/20">
              <p className="text-sm font-medium text-muted-foreground mb-4">Loading State:</p>
              <div className="flex justify-center">
                <LoadingLogo size="md" colorMode={activeColorMode} />
              </div>
            </div>
          </div>

          {/* Brand Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-brand-green to-brand-green-dark flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🌱
              </div>
              <h3 className="font-semibold mb-2 text-brand-green">Sustainable Growth</h3>
              <p className="text-sm text-muted-foreground">Building futures that flourish</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                💡
              </div>
              <h3 className="font-semibold mb-2 text-brand-purple">Creative Innovation</h3>
              <p className="text-sm text-muted-foreground">Where imagination meets technology</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-brand-yellow to-brand-yellow-dark flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="font-semibold mb-2 text-brand-yellow">Dynamic Energy</h3>
              <p className="text-sm text-muted-foreground">Powering transformation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
