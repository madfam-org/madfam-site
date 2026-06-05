# Documentation

## 📚 Quick Links

### Core Documentation

- [API Reference](./API.md) - API endpoints and integration
- [Testing Guide](./TESTING.md) - Testing strategies and practices

### 🔧 Development

- [Architecture Overview](./development/ARCHITECTURE.md)
- [Developer Onboarding](./development/DEVELOPER_ONBOARDING.md)
- [Local Development](./development/LOCAL_DEVELOPMENT.md)
- [Contributing](./development/CONTRIBUTING.md)
- [Database Schema](./development/DATABASE_SCHEMA.md)
- [Security](./development/security/) - Security guidelines and implementation
- [MCP Documentation](./development/mcp/) - Model Context Protocol setup

### 🚀 Deployment

- [Deployment Guide](./deployment/DEPLOYMENT.md)
- [Vercel Deployment](./deployment/VERCEL_DEPLOYMENT.md)
- [Staging Setup](./deployment/STAGING_DEPLOYMENT.md)
- [Troubleshooting](./deployment/DEPLOYMENT_TROUBLESHOOTING.md)

### 📖 Guides

- [Brand Guidelines](./guides/brand/) - Brand implementation and consistency
- [Internationalization](./guides/i18n/) - i18n and translation management
- [Mobile Optimization](./guides/MOBILE_OPTIMIZATION_GUIDE.md)
- [UI Components](./guides/ui/) - UI component documentation
- [User Guide](./guides/USER_GUIDE.md)
- [External Links Reference](./guides/EXTERNAL_LINKS_QUICK_REFERENCE.md)

### 📋 Planning

- [UX Roadmap](./planning/UX_ROADMAP.md) - User experience planning and roadmap
- [MADFAM Site Strategic Redesign Audit](./planning/MADFAM_SITE_STRATEGIC_REDESIGN_AUDIT_2026-06-04.md) - Public positioning, IA, conversion, and UI/UX remediation plan

## 🗂️ Structure

```
docs/
├── README.md              # This file
├── API.md                 # API documentation
├── TESTING.md             # Testing documentation
│
├── development/           # Developer documentation
│   ├── security/         # Security guidelines
│   ├── mcp/              # MCP server configuration
│   └── guide/            # Step-by-step guides
│
├── deployment/            # Deployment guides
├── design/                # Design specifications
├── infrastructure/        # Infrastructure docs
│
├── guides/                # Implementation guides
│   ├── brand/            # Brand guidelines
│   ├── i18n/             # Internationalization
│   └── ui/               # UI components
│
├── planning/              # Roadmaps and planning
│
└── archive/               # Historical documentation
    ├── audits/            # Audit reports
    ├── fixes/             # Fix documentation
    ├── dependencies/      # Dependency updates
    └── releases/          # Release notes
```

## 🎯 Getting Started

1. **New developers** → Start with [Developer Onboarding](./development/DEVELOPER_ONBOARDING.md)
2. **API integration** → See [API Reference](./API.md)
3. **Contributing** → Read [Contributing Guide](./development/CONTRIBUTING.md)
4. **Deployment** → Check [Deployment Guide](./deployment/DEPLOYMENT.md)

## 📝 Documentation Standards

- Use Markdown format
- Include code examples
- Keep content up-to-date
- Add "Last Updated" dates
- Use clear headings
- Provide practical examples

## 🔍 Finding Information

| Looking for...      | Check...                                              |
| ------------------- | ----------------------------------------------------- |
| API endpoints       | [API.md](./API.md)                                    |
| UI components       | [UI Documentation](./guides/ui/)                      |
| Testing approach    | [TESTING.md](./TESTING.md)                            |
| Deploy process      | [Deployment Guide](./deployment/DEPLOYMENT.md)        |
| Brand guidelines    | [Brand Guidelines](./guides/brand/)                   |
| i18n & Translation  | [Internationalization](./guides/i18n/)                |
| Mobile optimization | [Mobile Guide](./guides/MOBILE_OPTIMIZATION_GUIDE.md) |
| Security practices  | [Security Docs](./development/security/)              |
| MCP setup           | [MCP Documentation](./development/mcp/)               |
| Historical audits   | [Archive](./archive/audits/)                          |

## 📦 Historical Documentation

Historical documentation (audits, fixes, releases) has been organized in the `archive/` directory:

- **Audits**: [archive/audits/](./archive/audits/) - Codebase audits and security assessments
- **Fixes**: [archive/fixes/](./archive/fixes/) - Critical fixes and issue resolutions
- **Dependencies**: [archive/dependencies/](./archive/dependencies/) - Dependency update history
- **Releases**: [archive/releases/](./archive/releases/) - Release notes and summaries

---

Last Updated: November 2024
