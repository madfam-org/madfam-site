import * as React from 'react';
import { cn } from '../lib/utils';
import { Card, CardContent } from './Card';

export interface TestimonialData {
  id: string;
  content: string;
  author: {
    name: string;
    role: string;
    company: string;
    image?: string;
  };
  rating?: number;
  service?: string;
  results?: {
    metric: string;
    value: string;
    description: string;
  }[];
}

export interface TestimonialProps {
  testimonial: TestimonialData;
  variant?: 'card' | 'quote' | 'featured';
  showResults?: boolean;
  className?: string;
}

export interface TestimonialGridProps {
  testimonials: TestimonialData[];
  variant?: 'grid' | 'carousel' | 'masonry';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const Testimonial = React.forwardRef<HTMLDivElement, TestimonialProps>(
  ({ testimonial, variant = 'card', showResults = true, className }, ref) => {
    const { content, author, rating, service, results } = testimonial;

    const renderStars = (rating: number) => {
      return Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={cn('w-5 h-5', i < rating ? 'text-sun' : 'text-gray-300')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ));
    };

    if (variant === 'quote') {
      return (
        <div ref={ref} className={cn('relative', className)}>
          <div className="relative bg-gradient-to-r from-lavender/10 to-sun/10 rounded-2xl p-8">
            {/* Quote mark */}
            <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-r from-lavender to-sun rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="ml-16">
              <blockquote className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                "{content}"
              </blockquote>

              <div className="flex items-center gap-4">
                {author.image && (
                  <img
                    src={author.image}
                    alt={author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {author.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {author.role} • {author.company}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (variant === 'featured') {
      return (
        <Card ref={ref} className={cn('w-full max-w-4xl mx-auto', className)}>
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  {rating && renderStars(rating)}
                  {service && (
                    <span className="ml-2 text-sm bg-lavender/10 text-lavender px-2 py-1 rounded">
                      {service}
                    </span>
                  )}
                </div>

                <blockquote className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-6">
                  "{content}"
                </blockquote>

                <div className="flex items-center gap-4">
                  {author.image && (
                    <img
                      src={author.image}
                      alt={author.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                      {author.name}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">{author.role}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">{author.company}</div>
                  </div>
                </div>
              </div>

              {showResults && results && results.length > 0 && (
                <div className="lg:col-span-1">
                  <h4 className="font-heading font-bold text-lg mb-4">Resultados</h4>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-leaf/10 to-sun/10 rounded-lg p-4"
                      >
                        <div className="text-2xl font-bold text-leaf">{result.value}</div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {result.metric}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {result.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Default card variant
    return (
      <Card ref={ref} className={cn('h-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            {rating && renderStars(rating)}
            {service && (
              <span className="ml-2 text-sm bg-lavender/10 text-lavender px-2 py-1 rounded">
                {service}
              </span>
            )}
          </div>

          <blockquote className="text-gray-700 dark:text-gray-300 mb-6 flex-1">
            "{content}"
          </blockquote>

          <div className="flex items-center gap-3">
            {author.image && (
              <img
                src={author.image}
                alt={author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{author.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {author.role} • {author.company}
              </div>
            </div>
          </div>

          {showResults && results && results.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                {results.slice(0, 2).map((result, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xl font-bold text-leaf">{result.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{result.metric}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

Testimonial.displayName = 'Testimonial';

export const TestimonialGrid = React.forwardRef<HTMLDivElement, TestimonialGridProps>(
  ({ testimonials, variant = 'grid', columns = 3, className }, ref) => {
    if (variant === 'carousel') {
      return (
        <div ref={ref} className={cn('w-full', className)}>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="min-w-[400px]">
                <Testimonial testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (variant === 'masonry') {
      return (
        <div ref={ref} className={cn('w-full', className)}>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="break-inside-avoid mb-6">
                <Testimonial testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default grid variant
    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div
          className={cn(
            'grid gap-6',
            columns === 1 && 'grid-cols-1',
            columns === 2 && 'grid-cols-1 md:grid-cols-2',
            columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          )}
        >
          {testimonials.map(testimonial => (
            <Testimonial key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    );
  }
);

TestimonialGrid.displayName = 'TestimonialGrid';

// Sample testimonials data for testing
export const sampleTestimonials: TestimonialData[] = [
  {
    id: '1',
    content:
      'MADFAM transformó completamente nuestros procesos de diseño. Lo que antes nos tomaba semanas, ahora lo hacemos en días con mejor calidad.',
    author: {
      name: 'Ana García',
      role: 'Directora de Diseño',
      company: 'Innovatech',
      image: '/testimonials/ana-garcia.jpg',
    },
    rating: 5,
    service: 'Design & Fabrication',
    results: [
      { metric: 'Reducción de tiempo', value: '65%', description: 'En procesos de diseño' },
      { metric: 'Mejora en calidad', value: '40%', description: 'Evaluación de clientes' },
    ],
  },
  {
    id: '2',
    content:
      'La consultoría de IA nos ayudó a identificar oportunidades que no habíamos considerado. Su enfoque estratégico es excepcional.',
    author: {
      name: 'Carlos Mendoza',
      role: 'CTO',
      company: 'TechSolutions',
      image: '/testimonials/carlos-mendoza.jpg',
    },
    rating: 5,
    service: 'Strategy & Enablement',
    results: [
      { metric: 'ROI en 6 meses', value: '320%', description: 'Retorno de inversión' },
      { metric: 'Procesos automatizados', value: '15', description: 'Workflows optimizados' },
    ],
  },
  {
    id: '3',
    content:
      'Las plataformas de IA de MADFAM revolucionaron nuestra capacidad de integración. Ahora podemos conectar cualquier sistema sin problemas.',
    author: {
      name: 'María Rodríguez',
      role: 'Gerente de Operaciones',
      company: 'DataCorp',
      image: '/testimonials/maria-rodriguez.jpg',
    },
    rating: 5,
    service: 'Platform Pilots',
    results: [
      { metric: 'Integraciones activas', value: '50+', description: 'Sistemas conectados' },
      {
        metric: 'Tiempo de implementación',
        value: '80%',
        description: 'Reducción vs. métodos tradicionales',
      },
    ],
  },
];
