# Contributing Guide

Thank you for your interest in contributing to the MADFAM corporate website! This guide will help you get started with development.

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20+ (use `nvm` for version management)
- pnpm 8+ (`npm install -g pnpm`)
- Git
- VS Code (recommended) or your preferred editor

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/madfam-org/biz-site.git
   cd biz-site
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your values
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Branch Strategy

We use Git Flow:

- `main` - Production-ready code
- `staging` - Staging environment
- `develop` - Development integration
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks

### Creating a Feature

1. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit changes**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push branch**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to GitHub
   - Create PR against `develop`
   - Fill out PR template

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Maintenance tasks

Examples:

```bash
git commit -m "feat: add ROI calculator component"
git commit -m "fix: correct lead form validation"
git commit -m "docs: update API documentation"
```

## Code Standards

### TypeScript

- Enable strict mode
- Define types for all props
- Avoid `any` type
- Use interfaces over types when possible

```typescript
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

// Bad
const Button = (props: any) => { ... }
```

### React

- Use functional components
- Follow React hooks rules
- Memoize expensive computations
- Handle loading and error states

```tsx
// Good
const MyComponent = memo(() => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Component logic
});
```

### Styling

- Use Tailwind utility classes
- Follow mobile-first approach
- Extract repeated patterns to components
- Use design tokens from UI package

```tsx
// Good
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">

// Better (use UI component)
<Button variant="primary">Click me</Button>
```

### File Organization

```
components/
├── Button/
│   ├── Button.tsx        # Component
│   ├── Button.test.tsx   # Tests
│   └── index.ts          # Exports
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm test --filter=@madfam/ui

# Run E2E tests
pnpm test:e2e
```

### Writing Tests

We use Jest and React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Coverage

Aim for:

- 90% coverage for utilities
- 80% coverage for components
- 100% coverage for business logic

## Code Review Process

### Before Submitting PR

- [ ] Run `pnpm lint` and fix issues
- [ ] Run `pnpm typecheck` and fix errors
- [ ] Run `pnpm test` and ensure passing
- [ ] Update documentation if needed
- [ ] Add changeset if applicable

### PR Review Checklist

Reviewers will check:

- [ ] Code follows style guide
- [ ] Tests are included and passing
- [ ] No console.logs or debugging code
- [ ] Performance considerations
- [ ] Accessibility compliance
- [ ] Security best practices

## Documentation

### Code Comments

```typescript
/**
 * Calculates the lead score based on various factors
 * @param lead - The lead data to score
 * @returns A score between 0-100
 */
function calculateLeadScore(lead: LeadData): number {
  // Business emails score higher than personal
  if (isBusinessEmail(lead.email)) {
    score += 20;
  }

  // ... rest of logic
}
```

### README Updates

Update relevant README files when:

- Adding new features
- Changing configuration
- Adding dependencies
- Modifying build process

## Package Development

### Creating a New Package

```bash
# Create package directory
mkdir packages/new-package
cd packages/new-package

# Initialize package
pnpm init

# Add to workspace
# Edit package.json name: @madfam/new-package
```

### Package Structure

```
packages/new-package/
├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Performance Guidelines

### Bundle Size

- Monitor bundle size with `pnpm analyze`
- Use dynamic imports for heavy components
- Tree-shake unused code
- Lazy load images

### Optimization

```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensive(data);
}, [data]);
```

## Accessibility

### Requirements

- All interactive elements must be keyboard accessible
- Proper ARIA labels for screen readers
- Color contrast ratio of 4.5:1 minimum
- Focus indicators visible

### Testing

```bash
# Run accessibility tests
pnpm test:a11y

# Manual testing with screen reader
# Use NVDA (Windows) or VoiceOver (Mac)
```

## Security

### Best Practices

- Never commit secrets or API keys
- Validate all user inputs
- Sanitize data before rendering
- Use HTTPS for all requests
- Keep dependencies updated

### Security Scan

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix
```

## Debugging

### VS Code Configuration

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/apps/web",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Common Issues

1. **Module not found**
   - Check import paths
   - Verify package is installed
   - Restart dev server

2. **Type errors**
   - Run `pnpm typecheck`
   - Check for missing types
   - Update TypeScript

3. **Build failures**
   - Clear cache: `pnpm clean`
   - Delete node_modules
   - Reinstall: `pnpm install`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Testing Library](https://testing-library.com/docs/)

## Getting Help

- Create an issue for bugs
- Start a discussion for questions
- Join our Slack channel (internal team)
- Check existing issues first

## License

By contributing, you agree that your contributions will be licensed under the project's license.
