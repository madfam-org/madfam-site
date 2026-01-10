# Getting Started

Environment setup, installation, and first steps

Welcome to the MADFAM development team! This comprehensive guide will get you up and running with our AI consultancy platform, from initial setup to advanced development patterns.

## 🚀 Quick Start Checklist

- [ ] **Environment Setup** - Node.js, pnpm, VS Code
- [ ] **Repository Access** - Clone and install dependencies
- [ ] **Database Setup** - Initialize SQLite for development
- [ ] **Environment Variables** - Configure API keys and secrets
- [ ] **Development Server** - Start local development environment
- [ ] **First Contribution** - Make a small change and create PR

**Estimated Time:** 30-45 minutes

---

## 🛠️ Development Environment

### **Prerequisites**

**Required:**

- **Node.js** 20.x (use nvm: `nvm install 20 && nvm use 20`)
- **pnpm** 8+ (`npm install -g pnpm`)
- **Git** with SSH keys configured
- **VS Code** (recommended) or preferred editor

**Optional but Recommended:**

- **Docker** for CMS and external services
- **PostgreSQL** for production-like database testing
- **Postman** for API testing

### **Installation**

```bash
# 1. Clone the repository
git clone git@github.com:madfam-org/biz-site.git
cd biz-site

# 2. Install dependencies (this may take 2-3 minutes)
pnpm install

# 3. Setup environment variables
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your values (see Environment Variables section)

# 4. Initialize database
cd apps/web
npx prisma db push
npx prisma db seed  # Optional: adds sample data

# 5. Start development server
cd ../..
pnpm dev  # or pnpm dev:web for just the web app

# 6. Verify setup
open http://localhost:3002/es-MX
```

### **VS Code Setup**

Install recommended extensions (workspace file will prompt you):

- **TypeScript** - Enhanced TypeScript support
- **Prisma** - Database schema highlighting
- **Tailwind CSS IntelliSense** - CSS class suggestions
- **ESLint** - Code linting and formatting
- **GitLens** - Enhanced Git integration

**Workspace Settings** (`.vscode/settings.json`):

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"],
    ["clsx\\(([^)]*)\\)", "\"([^\"]*)\""]
  ]
}
```

---
