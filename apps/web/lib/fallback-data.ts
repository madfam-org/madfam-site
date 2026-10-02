/**
 * Advanced Fallback Data Management System
 * Provides structured fallback content with versioning and validation
 */

import type { BlogPost, CaseStudy, TeamMember } from './cms';
import { environment } from './environment';

// Fallback data version for cache busting
export const FALLBACK_DATA_VERSION = '1.0.0';

// Fallback data interface
interface FallbackDataSet {
  version: string;
  lastUpdated: string;
  blogPosts: BlogPost[];
  caseStudies: CaseStudy[];
  teamMembers: TeamMember[];
}

// Comprehensive fallback blog posts
// The fallback blog posts were invented content; removed 2026-10-01 (finding M1-001).
const fallbackBlogPosts: BlogPost[] = [];

// Fallback case studies
// The fallback case studies were invented clients and results; removed 2026-10-01
// (finding L1-002/M1-001). Only real, permissioned client stories may be added.
const fallbackCaseStudies: CaseStudy[] = [];

// Fallback team members
const fallbackTeamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Aldo Ruiz Luna',
    position: 'CEO & Founder',
    bio: 'Technology visionary with over 15 years transforming companies with AI and creativity.',
    avatar: { id: 'av-1', url: '/team/aldo.jpg', alt: 'Aldo Ruiz Luna' },
    social: { linkedin: 'https://linkedin.com/in/aldoruizluna' },
    status: 'active',
  },
  {
    id: 'tm-2',
    name: 'Daniela Martínez',
    position: 'Creative Director',
    bio: 'Expert in 3D design and digital experiences that connect brands with audiences.',
    avatar: { id: 'av-2', url: '/team/daniela.jpg', alt: 'Daniela Martínez' },
    status: 'active',
  },
  {
    id: 'tm-3',
    name: 'Carlos Mendoza',
    position: 'CTO',
    bio: 'Solutions architect leading enterprise platform implementations.',
    avatar: { id: 'av-3', url: '/team/carlos.jpg', alt: 'Carlos Mendoza' },
    status: 'active',
  },
  {
    id: 'tm-4',
    name: 'Ana López',
    position: 'AI Director',
    bio: 'Pioneer in intelligent automation and machine learning applied to business.',
    avatar: { id: 'av-4', url: '/team/ana.jpg', alt: 'Ana López' },
    status: 'active',
  },
];

// Main fallback data set
const fallbackDataSet: FallbackDataSet = {
  version: FALLBACK_DATA_VERSION,
  lastUpdated: '2024-03-15T10:00:00.000Z',
  blogPosts: fallbackBlogPosts,
  caseStudies: fallbackCaseStudies,
  teamMembers: fallbackTeamMembers,
};

// Fallback data manager class
export class FallbackDataManager {
  private static instance: FallbackDataManager;
  private dataSet: FallbackDataSet;

  private constructor() {
    this.dataSet = fallbackDataSet;
  }

  public static getInstance(): FallbackDataManager {
    if (!FallbackDataManager.instance) {
      FallbackDataManager.instance = new FallbackDataManager();
    }
    return FallbackDataManager.instance;
  }

  // Get all blog posts
  public getBlogPosts(_locale?: string): BlogPost[] {
    // In a real implementation, you might filter by locale
    return this.dataSet.blogPosts;
  }

  // Get blog post by slug
  public getBlogPost(slug: string, _locale?: string): BlogPost | null {
    return this.dataSet.blogPosts.find(post => post.slug === slug) || null;
  }

  // Get all case studies
  public getCaseStudies(_locale?: string): CaseStudy[] {
    return this.dataSet.caseStudies;
  }

  // Get case study by slug
  public getCaseStudy(slug: string, _locale?: string): CaseStudy | null {
    return this.dataSet.caseStudies.find(study => study.slug === slug) || null;
  }

  // Get all team members
  public getTeamMembers(): TeamMember[] {
    return this.dataSet.teamMembers.filter(member => member.status === 'active');
  }

  // Get data set info
  public getDataSetInfo() {
    return {
      version: this.dataSet.version,
      lastUpdated: this.dataSet.lastUpdated,
      counts: {
        blogPosts: this.dataSet.blogPosts.length,
        caseStudies: this.dataSet.caseStudies.length,
        teamMembers: this.dataSet.teamMembers.length,
      },
    };
  }

  // Validate data integrity
  public validateData(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate blog posts
    this.dataSet.blogPosts.forEach((post, index) => {
      if (!post.id || !post.title || !post.slug) {
        errors.push(`Blog post at index ${index} missing required fields`);
      }
      if (!post.content || !post.content.content) {
        errors.push(`Blog post "${post.title}" missing content`);
      }
    });

    // Validate case studies
    this.dataSet.caseStudies.forEach((study, index) => {
      if (!study.id || !study.title || !study.slug) {
        errors.push(`Case study at index ${index} missing required fields`);
      }
      if (!study.results || study.results.length === 0) {
        errors.push(`Case study "${study.title}" missing results`);
      }
    });

    // Validate team members
    this.dataSet.teamMembers.forEach((member, index) => {
      if (!member.id || !member.name || !member.position) {
        errors.push(`Team member at index ${index} missing required fields`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Singleton instance
export const fallbackDataManager = FallbackDataManager.getInstance();

// Convenience functions for easy access
export function getFallbackBlogPosts(locale?: string): BlogPost[] {
  return fallbackDataManager.getBlogPosts(locale);
}

export function getFallbackBlogPost(slug: string, locale?: string): BlogPost | null {
  return fallbackDataManager.getBlogPost(slug, locale);
}

export function getFallbackCaseStudies(locale?: string): CaseStudy[] {
  return fallbackDataManager.getCaseStudies(locale);
}

export function getFallbackCaseStudy(slug: string, locale?: string): CaseStudy | null {
  return fallbackDataManager.getCaseStudy(slug, locale);
}

export function getFallbackTeamMembers(): TeamMember[] {
  return fallbackDataManager.getTeamMembers();
}

// Validate fallback data in development
if (environment.isDevelopment) {
  const validation = fallbackDataManager.validateData();

  if (!validation.valid) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Fallback data validation issues:', validation.errors);
  }
}
