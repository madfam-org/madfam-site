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

// Fallback case studies
const fallbackCaseStudies: CaseStudy[] = [
  {
    id: 'cs-1',
    title: 'Digital Fabrication Workflow Automation for MakerSpace Network',
    slug: 'makerspace-fabrication-automation',
    client: 'Red de MakerSpaces LATAM',
    industry: 'Digital Fabrication',
    challenge:
      'A network of 12 makerspaces across Mexico and Colombia struggled with manual quoting, inconsistent pricing, and disconnected production tracking across locations.',
    solution:
      'Deployed Forge Sight for pricing intelligence, Cotiza Studio for automated quoting, and Pravara-MES for production tracking — all integrated through the MADFAM ecosystem.',
    results: [
      {
        metric: 'Quoting Time',
        value: '-75%',
        description: 'Reduced average quote turnaround from 48 hours to under 12 hours',
      },
      {
        metric: 'Pricing Consistency',
        value: '95%',
        description: 'Cross-location pricing variance reduced from 40% to under 5%',
      },
      {
        metric: 'Production Visibility',
        value: '100%',
        description: 'Real-time production tracking across all 12 locations',
      },
    ],
    technologies: [
      { technology: 'Forge Sight' },
      { technology: 'Cotiza Studio' },
      { technology: 'Pravara-MES' },
      { technology: 'Enclii' },
    ],
    status: 'published',
    publishedDate: '2024-02-20T10:00:00.000Z',
    createdAt: '2024-02-20T10:00:00.000Z',
    updatedAt: '2024-02-20T10:00:00.000Z',
  },
  {
    id: 'cs-2',
    title: 'AI-Driven Business Transformation for Agricultural Exporter',
    slug: 'agriexport-ai-transformation',
    client: 'AgriExport Colombia',
    industry: 'Agriculture & Export',
    challenge:
      'A mid-size agricultural exporter needed to modernize operations: manual inventory management, no demand forecasting, and paper-based compliance documentation slowed growth.',
    solution:
      'Implemented an AI transformation program including demand forecasting models, automated compliance document generation, and a custom dashboard built on the MADFAM platform stack.',
    results: [
      {
        metric: 'Forecast Accuracy',
        value: '89%',
        description: 'Demand forecast accuracy improved from 62% to 89%',
      },
      {
        metric: 'Compliance Processing',
        value: '-60%',
        description: 'Export compliance documentation time reduced by 60%',
      },
      {
        metric: 'Revenue Growth',
        value: '+23%',
        description:
          'Year-over-year revenue increase attributed to improved forecasting and faster export cycles',
      },
    ],
    technologies: [{ technology: 'Penny AI' }, { technology: 'Enclii' }, { technology: 'Dhanam' }],
    status: 'published',
    publishedDate: '2024-01-15T10:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
];

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
