'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Metric {
  id: string;
  value: number | null;
  displayValue: string;
  description: string;
  accentClass: string;
  prefix?: string;
  suffix?: string;
  animate: boolean;
}

const METRICS: Metric[] = [
  {
    id: 'vendors',
    value: 1000,
    displayValue: '1,000+',
    description: 'vendors tracked',
    accentClass: 'text-amber-400',
    suffix: '+',
    animate: true,
  },
  {
    id: 'laws',
    value: 11696,
    displayValue: '11,696',
    description: 'laws indexed',
    accentClass: 'text-rose-400',
    animate: true,
  },
  {
    id: 'cost',
    value: null,
    displayValue: '$55/mo',
    description: 'vs $2K+ cloud hosting',
    accentClass: 'text-blue-400',
    animate: false,
  },
  {
    id: 'designs',
    value: 40,
    displayValue: '40+',
    description: 'open-source designs',
    accentClass: 'text-purple-400',
    suffix: '+',
    animate: true,
  },
];

function formatNumber(num: number, suffix?: string): string {
  const rounded = Math.floor(num);
  const formatted = rounded.toLocaleString('en-US');
  return suffix ? `${formatted}${suffix}` : formatted;
}

function AnimatedMetric({
  metric,
  isVisible,
}: {
  metric: Metric;
  isVisible: boolean;
}): React.ReactElement {
  const [displayNum, setDisplayNum] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const duration = 2000;

  const animateCount = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const target = metric.value ?? 0;
      setDisplayNum(target * eased);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateCount);
      } else {
        setDisplayNum(target);
      }
    },
    [metric.value]
  );

  useEffect(() => {
    if (isVisible && metric.animate && metric.value != null) {
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animateCount);
    }

    return () => {
      if (animationRef.current != null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, metric.animate, metric.value, animateCount]);

  if (!metric.animate || metric.value == null) {
    return (
      <span
        className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-heading ${metric.accentClass}`}
      >
        {metric.prefix ?? ''}
        {metric.displayValue}
      </span>
    );
  }

  return (
    <span
      className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-heading ${metric.accentClass}`}
    >
      {metric.prefix ?? ''}
      {isVisible ? formatNumber(displayNum, metric.suffix) : '0'}
    </span>
  );
}

export function MetricsBar(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-12 md:py-16 bg-obsidian" aria-label="Key metrics">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {METRICS.map(metric => (
            <div key={metric.id} className="flex flex-col items-center text-center">
              <AnimatedMetric metric={metric} isVisible={isVisible} />
              <p className="mt-2 text-sm text-white/60">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
