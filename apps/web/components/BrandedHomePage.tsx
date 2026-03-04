'use client';

import React from 'react';
import { BrandShowcase } from './BrandShowcase';
import { SolarpunkHero } from './SolarpunkHero';
import { StaticBrandPattern } from '@/components/ui';

export const BrandedHomePage: React.FC = () => {
  return (
    <main className="relative">
      {/* Subtle brand pattern overlay for depth */}
      <StaticBrandPattern className="z-0" />

      {/* Hero Section */}
      <SolarpunkHero />

      {/* Brand Showcase */}
      <BrandShowcase />

      {/* Services Section with brand styling */}
      <section className="relative py-24 bg-gradient-to-b from-transparent via-brand-green/5 to-transparent">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-brand-purple to-brand-green bg-clip-text text-transparent">
            Our Creative Arsenal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI-Powered Solutions */}
            <div className="group relative overflow-hidden rounded-2xl bg-surface/50 backdrop-blur-sm border border-brand-green/20 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-2xl font-semibold mb-3 text-brand-green">AI Solutions</h3>
                <p className="text-muted-foreground">
                  Cutting-edge artificial intelligence integrated seamlessly into human-centered
                  design.
                </p>
              </div>
            </div>

            {/* Creative Development */}
            <div className="group relative overflow-hidden rounded-2xl bg-surface/50 backdrop-blur-sm border border-brand-purple/20 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-2xl font-semibold mb-3 text-brand-purple">Creative Dev</h3>
                <p className="text-muted-foreground">
                  Immersive digital experiences that push the boundaries of web technology.
                </p>
              </div>
            </div>

            {/* Strategic Growth */}
            <div className="group relative overflow-hidden rounded-2xl bg-surface/50 backdrop-blur-sm border border-brand-yellow/20 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-2xl font-semibold mb-3 text-brand-yellow">Growth Strategy</h3>
                <p className="text-muted-foreground">
                  Data-driven approaches to scale your digital presence exponentially.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-surface/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-brand-green">150+</div>
              <div className="text-muted-foreground">Projects Delivered</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-brand-purple">50+</div>
              <div className="text-muted-foreground">Happy Clients</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-brand-yellow">10+</div>
              <div className="text-muted-foreground">Years Experience</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-brand-green to-brand-purple bg-clip-text text-transparent">
                ∞
              </div>
              <div className="text-muted-foreground">Creative Ideas</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
