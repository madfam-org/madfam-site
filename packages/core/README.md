# @madfam/core

Core business logic, types, and utilities for MADFAM applications.

## Overview

This package contains the business logic, type definitions, and core functionality shared across MADFAM applications. It includes transformation program definitions, feature flags, and domain models.

## Installation

This package is part of the monorepo and is automatically available to other packages.

```typescript
import { ServiceTier, FeatureFlagProvider } from '@madfam/core';
```

## Modules

### Transformation Programs

The core of MADFAM's business model - four transformation programs.

```typescript
import { ProgramType, programs } from '@madfam/core';

// Access a specific program
const strategyProgram = programs[ProgramType.STRATEGY_ENABLEMENT];

// Use in components
<ProgramCard program={strategyProgram} />
```

#### ProgramType Enum

```typescript
enum ProgramType {
  DESIGN_FABRICATION = 'design-fabrication',
  STRATEGY_ENABLEMENT = 'strategy-enablement',
  PLATFORM_PILOTS = 'platform-pilots',
  STRATEGIC_PARTNERSHIPS = 'strategic-partnerships',
}
```

#### ProgramConfig Interface

```typescript
interface ProgramConfig {
  id: ProgramType;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  startingPrice: number;
  currency: 'MXN' | 'USD';
  features: string[];
  featuresEn: string[];
  idealFor: string[];
  idealForEn: string[];
  cta: {
    text: string;
    textEn: string;
    action: 'quote' | 'contact' | 'book' | 'demo';
  };
  color: 'leaf' | 'sun' | 'lavender' | 'obsidian' | 'creative';
  icon: string;
  units: string[];
}
```

### Feature Flags

Control feature availability across environments.

```typescript
import { FeatureFlagProvider } from '@madfam/core';

// Initialize
const flags = new FeatureFlagProvider();

// Check if feature is enabled
if (flags.isEnabled('NEW_LEAD_SCORING')) {
  // Use new feature
}

// Get all flags
const allFlags = flags.getAllFlags();
```

#### Available Flags

```typescript
const featureFlags = {
  NEW_LEAD_SCORING: {
    development: true,
    staging: true,
    production: false,
  },
  INTERACTIVE_CALCULATOR: {
    development: true,
    staging: true,
    production: true,
  },
  CHAT_SUPPORT: {
    development: true,
    staging: false,
    production: false,
  },
  PORTUGUESE_LOCALE: {
    development: true,
    staging: true,
    production: false,
  },
};
```

## Usage Examples

### Program Selection

```typescript
import { ProgramType, programs } from '@madfam/core';

function ProgramSelector() {
  const allPrograms = Object.values(programs);

  return (
    <select>
      {allPrograms.map(program => (
        <option key={program.id} value={program.id}>
          {program.name} (${program.startingPrice} {program.currency})
        </option>
      ))}
    </select>
  );
}
```

### Feature Flag Hook

```typescript
import { FeatureFlagProvider } from '@madfam/core';
import { useEffect, useState } from 'react';

function useFeatureFlag(flagKey: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const provider = new FeatureFlagProvider();
    setIsEnabled(provider.isEnabled(flagKey));
  }, [flagKey]);

  return isEnabled;
}

// Usage
function MyComponent() {
  const showNewFeature = useFeatureFlag('NEW_LEAD_SCORING');

  if (showNewFeature) {
    return <NewFeature />;
  }

  return <OldFeature />;
}
```

### Program Pricing Display

```typescript
import { programs, ProgramType } from '@madfam/core';

function PricingTable() {
  const featured = [
    ProgramType.DESIGN_FABRICATION,
    ProgramType.STRATEGY_ENABLEMENT,
    ProgramType.STRATEGIC_PARTNERSHIPS
  ];

  return (
    <div className="pricing-grid">
      {featured.map(programId => {
        const program = programs[programId];
        return (
          <div key={program.id} className="pricing-card">
            <h3>{program.name}</h3>
            <p className="price">
              Desde ${program.startingPrice.toLocaleString()} {program.currency}
            </p>
            <ul>
              {program.features.slice(0, 3).map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <button>{program.cta.text}</button>
          </div>
        );
      })}
    </div>
  );
}
```

## Type Definitions

### Business Types

```typescript
// Lead scoring
interface LeadScore {
  value: number; // 0-100
  factors: {
    email: number;
    company: number;
    program: number;
    engagement: number;
  };
}

// Service inquiry
interface ServiceInquiry {
  program: ProgramType;
  timestamp: Date;
  source: string;
  metadata?: Record<string, unknown>;
}
```

## Development

### Adding New Features

1. **New Transformation Program**
   - Update `ProgramType` enum
   - Add configuration to `programs` object
   - Update translations

2. **New Feature Flag**
   - Add to `featureFlags` object
   - Set environment defaults
   - Document usage

3. **New Business Logic**
   - Create new file in appropriate directory
   - Export from index.ts
   - Add tests

### Testing

```bash
# Run tests
pnpm test

# Test coverage
pnpm test:coverage
```

## Best Practices

1. **Type Safety**
   - Use enums for fixed values
   - Define interfaces for all data structures
   - Avoid `any` type

2. **Internationalization**
   - Include both Spanish and English text
   - Use consistent naming (field/fieldEn)

3. **Feature Flags**
   - Default to false in production
   - Test thoroughly in staging
   - Document rollout strategy

4. **Business Logic**
   - Keep pure functions
   - Avoid side effects
   - Make testable

## Future Additions

Planned additions to the core package:

- **Lead scoring algorithm** - Advanced AI-driven lead qualification
- **ROI calculation models** - Service-specific ROI projections
- **Service recommendation engine** - Intelligent tier suggestions
- **Pricing calculators** - Dynamic pricing based on requirements
- **Business rules engine** - Configurable business logic

## API Reference

### Core Classes

#### FeatureFlagProvider

```typescript
class FeatureFlagProvider {
  isEnabled(flagKey: string): boolean;
  getAllFlags(): Record<string, boolean>;
  getEnvironment(): 'development' | 'staging' | 'production';
}
```

#### ProgramUtils

```typescript
class ProgramUtils {
  static getByName(name: string): ProgramConfig | undefined;
  static getRecommendedProgram(requirements: string[]): ProgramType;
  static calculatePrice(program: ProgramType, requirements: object): number;
}
```

## Contributing

When contributing to the core package:

1. **Maintain backward compatibility** - Never break existing APIs
2. **Update all affected packages** - Ensure monorepo consistency
3. **Add comprehensive tests** - Cover edge cases and error paths
4. **Document new features** - Update this README and inline docs
5. **Update TypeScript definitions** - Keep types accurate and complete

## Package Information

| Property         | Value                     |
| ---------------- | ------------------------- |
| **Package Name** | @madfam/core              |
| **Version**      | 0.1.0                     |
| **Last Updated** | July 2025                 |
| **Dependencies** | Minimal (TypeScript only) |
| **Bundle Size**  | < 10KB                    |

## License

Part of MADFAM monorepo - All rights reserved.

---

**Maintained by**: MADFAM Core Team  
**Next Review**: August 2025
