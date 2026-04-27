/**
 * Performance Monitoring and Metrics System
 * Tracks CMS performance, static generation metrics, and system health
 */

import { environment } from './environment';

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  context?: Record<string, unknown>;
}

// CMS performance metrics
export interface CMSMetrics {
  responseTime: number;
  cacheHitRate: number;
  errorRate: number;
  requestCount: number;
  averageRequestSize: number;
}

// Static generation metrics
export interface StaticGenerationMetrics {
  buildTime: number;
  pageCount: number;
  cacheEfficiency: number;
  errorCount: number;
  memoryUsage: number;
}

// System health metrics
export interface SystemHealthMetrics {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  networkLatency: number;
}

// Performance monitor class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private startTime = Date.now();

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeMonitoring() {
    if (environment.performance.performanceMonitoring) {
      // Initialize performance monitoring
      this.setupPerformanceObserver();
      this.startSystemMetricsCollection();
    }
  }

  private setupPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Web Vitals monitoring
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const entryWithValue = entry as PerformanceEntry & { value?: number };
          this.recordMetric({
            name: `web_vitals_${entry.name}`,
            value: entryWithValue.value ?? entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
            context: {
              entryType: entry.entryType,
              startTime: entry.startTime,
            },
          });
        }
      });

      // Observe different performance entry types
      ['largest-contentful-paint', 'first-input', 'layout-shift'].forEach(type => {
        try {
          observer.observe({ entryTypes: [type] });
        } catch {
          // Entry type not supported
        }
      });
    }
  }

  private startSystemMetricsCollection() {
    if (typeof window !== 'undefined') {
      // Collect system metrics every 30 seconds
      setInterval(() => {
        this.collectSystemMetrics();
      }, 30000);
    }
  }

  private collectSystemMetrics() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Memory usage
      if ('memory' in performance) {
        const performanceWithMemory = performance as Performance & {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        };
        const { memory } = performanceWithMemory;
        if (memory) {
          this.recordMetric({
            name: 'memory_usage',
            value: memory.usedJSHeapSize,
            unit: 'bytes',
            timestamp: Date.now(),
            context: {
              total: memory.totalJSHeapSize,
              limit: memory.jsHeapSizeLimit,
            },
          });
        }
      }

      // Navigation timing
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation && navigation.loadEventEnd && navigation.domContentLoadedEventEnd) {
        this.recordMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          unit: 'ms',
          timestamp: Date.now(),
          context: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstByte: navigation.responseStart - navigation.fetchStart,
          },
        });
      }
    }
  }

  // Record a performance metric
  public recordMetric(metric: PerformanceMetric) {
    // Tag critical metrics in context so downstream consumers (Sentry, RUM
    // beacons) can filter on `context.critical === true`. Threshold logic
    // lives in isCriticalMetric() so it stays trivially testable.
    if (this.isCriticalMetric(metric)) {
      metric = {
        ...metric,
        context: { ...(metric.context ?? {}), critical: true },
      };
    }

    this.metrics.push(metric);

    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private isCriticalMetric(metric: PerformanceMetric): boolean {
    const criticalThresholds: Record<string, number> = {
      cms_response_time: 5000, // 5 seconds
      page_load_time: 3000, // 3 seconds
      memory_usage: 100 * 1024 * 1024, // 100MB
      error_rate: 5, // 5%
    };

    const threshold = criticalThresholds[metric.name];
    return threshold !== undefined && metric.value > threshold;
  }

  // CMS Performance tracking
  public async measureCMSRequest<T>(
    operation: string,
    request: () => Promise<T>
  ): Promise<{ result: T; metrics: CMSMetrics }> {
    const startTime = Date.now();
    let result: T;
    let error = false;

    try {
      result = await request();
    } catch (e) {
      error = true;
      throw e;
    } finally {
      const responseTime = Date.now() - startTime;

      this.recordMetric({
        name: 'cms_response_time',
        value: responseTime,
        unit: 'ms',
        timestamp: Date.now(),
        context: {
          operation,
          success: !error,
        },
      });

      if (error) {
        this.recordMetric({
          name: 'cms_error',
          value: 1,
          unit: 'count',
          timestamp: Date.now(),
          context: { operation },
        });
      }
    }

    const metrics: CMSMetrics = {
      responseTime: Date.now() - startTime,
      cacheHitRate: this.calculateCacheHitRate(),
      errorRate: this.calculateErrorRate('cms'),
      requestCount: this.getMetricCount('cms_response_time'),
      averageRequestSize: 0, // Would need to implement request size tracking
    };

    return { result: result as T, metrics };
  }

  // Static generation performance tracking
  public measureStaticGeneration<T>(
    operation: string,
    generator: () => Promise<T>
  ): Promise<{ result: T; metrics: StaticGenerationMetrics }> {
    const startTime = Date.now();

    return generator().then(result => {
      const buildTime = Date.now() - startTime;

      this.recordMetric({
        name: 'static_generation_time',
        value: buildTime,
        unit: 'ms',
        timestamp: Date.now(),
        context: { operation },
      });

      const metrics: StaticGenerationMetrics = {
        buildTime,
        pageCount: 0, // Would be passed from the generator
        cacheEfficiency: this.calculateCacheHitRate(),
        errorCount: this.getMetricCount('static_generation_error'),
        memoryUsage: this.getLatestMetricValue('memory_usage') || 0,
      };

      return { result, metrics };
    });
  }

  // Get performance summary
  public getPerformanceSummary(): {
    uptime: number;
    totalMetrics: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    cacheHitRate: number;
  } {
    const uptime = Date.now() - this.startTime;
    const responseTimeMetrics = this.metrics.filter(m => m.name.includes('response_time'));

    return {
      uptime,
      totalMetrics: this.metrics.length,
      averageResponseTime:
        responseTimeMetrics.length > 0
          ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
          : 0,
      errorRate: this.calculateErrorRate(),
      memoryUsage: this.getLatestMetricValue('memory_usage') || 0,
      cacheHitRate: this.calculateCacheHitRate(),
    };
  }

  // Get metrics by name and time range
  public getMetrics(name?: string, startTime?: number, endTime?: number): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }

    return filtered;
  }

  // Calculate cache hit rate
  private calculateCacheHitRate(): number {
    const cacheHits = this.getMetricCount('cache_hit');
    const cacheMisses = this.getMetricCount('cache_miss');
    const total = cacheHits + cacheMisses;

    return total > 0 ? (cacheHits / total) * 100 : 0;
  }

  // Calculate error rate
  private calculateErrorRate(prefix?: string): number {
    const errorCount = this.metrics.filter(
      m => m.name.includes('error') && (!prefix || m.name.startsWith(prefix))
    ).length;
    const totalRequests = this.metrics.filter(
      m => m.name.includes('response_time') && (!prefix || m.name.startsWith(prefix))
    ).length;

    return totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
  }

  // Get metric count
  private getMetricCount(name: string): number {
    return this.metrics.filter(m => m.name === name).length;
  }

  // Get latest metric value
  private getLatestMetricValue(name: string): number | null {
    const metrics = this.metrics.filter(m => m.name === name);
    return metrics.length > 0 ? (metrics[metrics.length - 1]?.value ?? null) : null;
  }

  // Export metrics for analysis
  public exportMetrics(): {
    metadata: {
      exportTime: string;
      environment: string;
      version: string;
      uptime: number;
    };
    metrics: PerformanceMetric[];
    summary: ReturnType<PerformanceMonitor['getPerformanceSummary']>;
  } {
    return {
      metadata: {
        exportTime: new Date().toISOString(),
        environment: environment.type,
        version: environment.build.version,
        uptime: Date.now() - this.startTime,
      },
      metrics: this.metrics,
      summary: this.getPerformanceSummary(),
    };
  }

  // Clear metrics (useful for testing)
  public clearMetrics() {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export function measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const start = Date.now();

  return operation().finally(() => {
    performanceMonitor.recordMetric({
      name,
      value: Date.now() - start,
      unit: 'ms',
      timestamp: Date.now(),
    });
  });
}

export function measureSync<T>(name: string, operation: () => T): T {
  const start = Date.now();
  const monitor = performanceMonitor;

  try {
    return operation();
  } finally {
    monitor.recordMetric({
      name,
      value: Date.now() - start,
      unit: 'ms',
      timestamp: Date.now(),
    });
  }
}

// Record cache operations
export function recordCacheHit(key: string) {
  performanceMonitor.recordMetric({
    name: 'cache_hit',
    value: 1,
    unit: 'count',
    timestamp: Date.now(),
    context: { key },
  });
}

export function recordCacheMiss(key: string) {
  performanceMonitor.recordMetric({
    name: 'cache_miss',
    value: 1,
    unit: 'count',
    timestamp: Date.now(),
    context: { key },
  });
}

// Performance monitoring is initialized automatically via the singleton
