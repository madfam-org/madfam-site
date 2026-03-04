# Component & API Development

Building components, APIs, and database interactions

### **Creating a New Component**

1. **Create component file** in appropriate package:

```tsx
// packages/ui/src/components/NewComponent.tsx
import React from 'react';
import { cn } from '../lib/utils';

interface NewComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const NewComponent = React.forwardRef<HTMLDivElement, NewComponentProps>(
  ({ variant = 'primary', size = 'md', children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'base-styles',
          variant === 'primary' && 'primary-styles',
          variant === 'secondary' && 'secondary-styles',
          size === 'sm' && 'small-styles',
          size === 'lg' && 'large-styles',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NewComponent.displayName = 'NewComponent';
```

2. **Export from index file**:

```tsx
// packages/ui/src/index.ts
export { NewComponent } from './components/NewComponent';
export type { NewComponentProps } from './components/NewComponent';
```

3. **Write tests**:

```tsx
// packages/ui/src/components/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  it('renders children correctly', () => {
    render(<NewComponent>Test content</NewComponent>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    render(<NewComponent variant="secondary">Test</NewComponent>);
    expect(screen.getByText('Test')).toHaveClass('secondary-styles');
  });
});
```

### **Component Best Practices**

- **Forward refs** for proper DOM access
- **Composable API** with sensible defaults
- **TypeScript interfaces** for all props
- **Responsive design** with mobile-first approach
- **Accessibility** with proper ARIA attributes
- **Dark mode support** using CSS variables

---

## 🗄️ Database Development

### **Schema Changes**

```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add-new-feature

# 3. Generate updated client
npx prisma generate

# 4. Update TypeScript types (automatic)
```

### **Common Patterns**

#### **Creating Models with Relations**

```prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  data      Json     // Flexible data storage
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([leadId])
  @@index([createdAt])
}
```

#### **Database Queries**

```tsx
// Read operations
const leads = await prisma.lead.findMany({
  where: {
    status: 'NEW',
    program: 'STRATEGY_ENABLEMENT',
  },
  include: {
    assessments: true,
    activities: {
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
  orderBy: { score: 'desc' },
});

// Write operations
const newLead = await prisma.lead.create({
  data: {
    email: 'user@company.com',
    firstName: 'John',
    lastName: 'Doe',
    program: 'STRATEGY_ENABLEMENT',
    activities: {
      create: {
        type: 'lead_created',
        description: 'Lead created via website form',
      },
    },
  },
  include: { activities: true },
});
```

---

## 🚀 API Development

### **Creating New Endpoints**

1. **Create API route file**:

```tsx
// apps/web/app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limit';

// Input validation schema
const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  type: z.enum(['type1', 'type2']),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = CreateSchema.parse(body);

    // Business logic
    const result = await prisma.newModel.create({
      data: validatedData,
    });

    // Success response
    return NextResponse.json({
      success: true,
      id: result.id,
      message: 'Created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Implementation for GET method
}
```

2. **Add TypeScript types**:

```tsx
// apps/web/types/api.ts
export interface CreateNewEndpointRequest {
  name: string;
  email: string;
  type: 'type1' | 'type2';
}

export interface CreateNewEndpointResponse {
  success: boolean;
  id?: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}
```

3. **Create client helper**:

```tsx
// apps/web/lib/api-client.ts
export async function createNewEndpoint(data: CreateNewEndpointRequest) {
  const response = await fetch('/api/new-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json() as Promise<CreateNewEndpointResponse>;
}
```

### **API Best Practices**

- **Input Validation**: Always use Zod schemas
- **Rate Limiting**: Implement on public endpoints
- **Error Handling**: Consistent error response format
- **Type Safety**: Define request/response types
- **Authentication**: Protect sensitive endpoints
- **Logging**: Log errors and important events

---
