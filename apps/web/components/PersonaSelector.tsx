'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/components/ui';

export type Persona = 'ceo' | 'cfo' | 'cto' | 'designer' | 'educator' | 'default';

interface PersonaSelectorProps {
  onPersonaChange?: (persona: Persona) => void;
  className?: string;
}

const personas = [
  {
    id: 'ceo' as const,
    label: 'CEO / Founder',
    icon: '💼',
    description: 'Strategic transformation & growth',
  },
  {
    id: 'cfo' as const,
    label: 'CFO / Finance',
    icon: '💰',
    description: 'ROI & cost optimization',
  },
  {
    id: 'cto' as const,
    label: 'CTO / Tech Leader',
    icon: '🔧',
    description: 'Technical implementation',
  },
  {
    id: 'designer' as const,
    label: 'Designer / Creative',
    icon: '🎨',
    description: 'Digital fabrication',
  },
  {
    id: 'educator' as const,
    label: 'Educator / Researcher',
    icon: '📚',
    description: 'Learning & innovation',
  },
];

export function PersonaSelector({ onPersonaChange, className }: PersonaSelectorProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona>('default');
  const [isOpen, setIsOpen] = useState(false);

  // Load persona from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('madfam_persona') as Persona | null;
    if (stored && stored !== 'default') {
      setSelectedPersona(stored);
      onPersonaChange?.(stored);
    }
  }, [onPersonaChange]);

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    localStorage.setItem('madfam_persona', persona);
    onPersonaChange?.(persona);
    setIsOpen(false);
  };

  const selectedPersonaData = personas.find(p => p.id === selectedPersona);

  return (
    <div className={cn('relative', className)}>
      {/* Label */}
      <label className="block text-sm font-medium text-neutral-700 mb-2">I&apos;m a...</label>

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 bg-white border-2 rounded-xl transition-all',
          isOpen
            ? 'border-green-400 ring-4 ring-green-100'
            : 'border-neutral-200 hover:border-green-300'
        )}
      >
        <div className="flex items-center gap-3">
          {selectedPersona === 'default' ? (
            <>
              <span className="text-2xl">👤</span>
              <div className="text-left">
                <div className="font-semibold text-neutral-900">Select your role</div>
                <div className="text-xs text-neutral-500">Get personalized content</div>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl">{selectedPersonaData?.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-neutral-900">{selectedPersonaData?.label}</div>
                <div className="text-xs text-neutral-500">{selectedPersonaData?.description}</div>
              </div>
            </>
          )}
        </div>
        <svg
          className={cn('w-5 h-5 text-neutral-500 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-neutral-200 rounded-xl shadow-xl overflow-hidden">
            {personas.map(persona => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handlePersonaSelect(persona.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  selectedPersona === persona.id
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : 'hover:bg-neutral-50 border-l-4 border-transparent'
                )}
              >
                <span className="text-2xl">{persona.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900">{persona.label}</div>
                  <div className="text-xs text-neutral-500">{persona.description}</div>
                </div>
                {selectedPersona === persona.id && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Hook to get persona-specific content
export function usePersonaContent(persona: Persona) {
  const content = {
    ceo: {
      title: 'Transform Operations with AI—Drive Strategic Growth',
      subtitle:
        'Leverage intelligent systems to amplify efficiency, accelerate innovation, and unlock new revenue streams across your organization.',
      primaryCTA: 'View Strategic Roadmap',
      secondaryCTA: 'Calculate ROI',
      benefits: [
        'Strategic AI implementation roadmap',
        'Executive-level transformation consulting',
        'Competitive advantage through innovation',
        'Measurable business impact in 90 days',
      ],
      recommendedPath: '/assessment',
    },
    cfo: {
      title: 'Optimize Costs & Maximize ROI with AI',
      subtitle:
        'Turn operational expenses into strategic investments. Our AI solutions deliver measurable cost reductions and efficiency gains from day one.',
      primaryCTA: 'Calculate Your ROI',
      secondaryCTA: 'View Pricing',
      benefits: [
        'Average 35% operational cost reduction',
        'ROI positive within 6 months',
        'Transparent pricing with no hidden fees',
        'Financial wellness programs that reduce turnover',
      ],
      recommendedPath: '/calculator',
    },
    cto: {
      title: 'Build Scalable AI Infrastructure—From POC to Production',
      subtitle:
        'Enterprise-grade AI platforms that integrate seamlessly with your existing tech stack. Built for scale, security, and developer productivity.',
      primaryCTA: 'Explore Technical Docs',
      secondaryCTA: 'Book Technical Demo',
      benefits: [
        'API-first architecture with SDKs',
        'SOC 2 & GDPR compliant infrastructure',
        'Self-hosted or cloud deployment options',
        'Technical support & integration assistance',
      ],
      recommendedPath: '/products',
    },
    designer: {
      title: 'Amplify Creativity with AI-Powered Digital Fabrication',
      subtitle:
        'From concept to physical prototype in record time. Intelligent tools that optimize designs, estimate costs, and streamline production.',
      primaryCTA: 'Explore Products',
      secondaryCTA: 'Try Forge Sight',
      benefits: [
        '3D printing & CNC optimization',
        'Instant pricing for materials & processes',
        'Design iteration 5x faster',
        'Access to fabrication network',
      ],
      recommendedPath: '/products',
    },
    educator: {
      title: 'Empower the Next Generation with AI Education',
      subtitle:
        'Comprehensive AI training programs, certifications, and innovation labs designed for educational institutions and research teams.',
      primaryCTA: 'Explore Co-Labs',
      secondaryCTA: 'View Programs',
      benefits: [
        'Curriculum development & training',
        'Innovation lab setup & management',
        'Student certification programs',
        'Research collaboration opportunities',
      ],
      recommendedPath: '/solutions/colabs',
    },
    default: {
      title: 'Transform Operations with AI—From Strategy to Production',
      subtitle:
        'We turn operational challenges into regenerative growth through intelligent systems that optimize efficiency, close material loops, and amplify human creativity across LATAM.',
      primaryCTA: 'Take AI Assessment',
      secondaryCTA: 'Explore Solutions',
      benefits: [
        'AI strategy & implementation',
        'Production-ready platforms',
        'Regenerative business practices',
        'LATAM-focused solutions',
      ],
      recommendedPath: '/assessment',
    },
  };

  return content[persona];
}
