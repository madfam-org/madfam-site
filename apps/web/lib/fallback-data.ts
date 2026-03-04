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
const fallbackBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI in Business Transformation',
    excerpt:
      'Explore how artificial intelligence is reshaping the business landscape and creating new opportunities for growth and innovation.',
    publishedDate: '2024-03-15T10:00:00.000Z',
    author: { id: '1', name: 'MADFAM Team', email: 'team@madfam.io' },
    slug: 'future-ai-business-transformation',
    status: 'published',
    tags: [{ tag: 'AI & Innovation' }, { tag: 'Business Strategy' }],
    createdAt: '2024-03-15T10:00:00.000Z',
    updatedAt: '2024-03-15T10:00:00.000Z',
    featuredImage: {
      id: 'img-1',
      url: '/blog/ai-transformation.jpg',
      alt: 'AI transforming business processes',
      width: 1200,
      height: 630,
    },
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Artificial Intelligence is no longer a futuristic concept—it's here, and it's transforming businesses across every industry. From automating routine tasks to providing deep insights through data analysis, AI is becoming an essential tool for companies looking to stay competitive in today's fast-paced market.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The integration of AI into business processes offers unprecedented opportunities for efficiency gains, cost reduction, and innovation. Companies that embrace AI technologies early are positioning themselves for long-term success in an increasingly digital world.',
            },
          ],
        },
      ],
    },
  },
  {
    id: '2',
    title: 'Building Scalable Digital Platforms: A Technical Guide',
    excerpt:
      'Learn the key architectural principles and best practices for building platforms that can grow with your business.',
    publishedDate: '2024-03-10T10:00:00.000Z',
    author: { id: '2', name: 'MADFAM Engineering', email: 'engineering@madfam.io' },
    slug: 'building-scalable-digital-platforms',
    status: 'published',
    tags: [{ tag: 'Technical' }, { tag: 'Architecture' }],
    createdAt: '2024-03-10T10:00:00.000Z',
    updatedAt: '2024-03-10T10:00:00.000Z',
    featuredImage: {
      id: 'img-2',
      url: '/blog/scalable-platforms.jpg',
      alt: 'Digital platform architecture diagram',
      width: 1200,
      height: 630,
    },
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Building scalable digital platforms requires careful planning, robust architecture, and a deep understanding of both current needs and future growth. In this comprehensive guide, we'll explore the key principles and best practices that have helped us build platforms that serve millions of users.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Scalability isn't just about handling more users—it's about creating systems that can adapt, evolve, and maintain performance under varying loads. From microservices architecture to database optimization, every decision impacts your platform's ability to scale.",
            },
          ],
        },
      ],
    },
  },
  {
    id: '3',
    title: 'Customer Success Story: Transforming Operations with Automation',
    excerpt:
      'How we helped a leading manufacturer reduce operational costs by 40% through intelligent automation solutions.',
    publishedDate: '2024-03-05T10:00:00.000Z',
    author: { id: '3', name: 'MADFAM Consulting', email: 'consulting@madfam.io' },
    slug: 'customer-success-automation',
    status: 'published',
    tags: [{ tag: 'Case Studies' }, { tag: 'Automation' }],
    createdAt: '2024-03-05T10:00:00.000Z',
    updatedAt: '2024-03-05T10:00:00.000Z',
    featuredImage: {
      id: 'img-3',
      url: '/blog/automation-success.jpg',
      alt: 'Automated manufacturing process',
      width: 1200,
      height: 630,
    },
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'When a leading manufacturing company approached us with challenges around operational efficiency and rising costs, we knew that intelligent automation could be the solution. Through a comprehensive 6-month transformation project, we helped them achieve remarkable results.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The transformation involved implementing AI-driven process automation, predictive maintenance systems, and real-time monitoring dashboards. The results exceeded expectations: 40% reduction in operational costs, 60% improvement in efficiency, and 99.2% uptime.',
            },
          ],
        },
      ],
    },
  },
];

// Fallback case studies — placeholder data for development only
// TODO: Replace with real case studies from CMS when available
const fallbackCaseStudies: CaseStudy[] = [];

// Fallback team members — placeholder data for development only
// TODO: Replace with real team data from CMS when available
const fallbackTeamMembers: TeamMember[] = [];

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

// Initialize fallback data validation in development
if (environment.isDevelopment) {
  const validation = fallbackDataManager.validateData();
  const dataInfo = fallbackDataManager.getDataSetInfo();

  // eslint-disable-next-line no-console
  console.log('📦 Fallback Data Manager:', {
    version: dataInfo.version,
    lastUpdated: dataInfo.lastUpdated,
    counts: dataInfo.counts,
    valid: validation.valid,
  });

  if (!validation.valid) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Fallback data validation issues:', validation.errors);
  }
}
