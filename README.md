# Minato UI

A Next.js 15 web application for managing multiple minato control planes with full RBAC, SSO/OIDC, Basic auth, game server management, and administrative features.

## Architecture

```
Browser → Next.js (App Router) → BFF API Routes → Control Plane(s)
              │                         │
              ▼                         ▼
      NextAuth.js (OIDC/Basic)    PostgreSQL (Prisma)
              │
              ▼
      Token Pass-Through to CP
```

## Features

- **Multi-Control-Plane**: Connect to and manage multiple minato control planes from a single UI
- **Authentication**: OIDC (SSO) and Basic auth with token pass-through to control planes
- **RBAC**: Role-based access control (viewer, operator, admin) enforced by the control plane
- **Game Server Management**: List, create, delete, and manage game servers
- **Fleet Management**: Scale and monitor game server fleets
- **Profile Browser**: View available game profiles and their capabilities
- **Snapshots**: Create and manage game server snapshots
- **Console Access**: Real-time console streaming (when supported by control plane)
- **Audit Logs**: View action execution history
- **API Key Management**: Generate and revoke API keys

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.5+ (strict) |
| Design System | `7k-design-system@latest` |
| Database | PostgreSQL 15+ (CNPG operator) |
| ORM | Prisma 7+ |
| Auth | NextAuth.js v5 (Auth.js) |
| State | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Testing | Vitest + RTL + Playwright |
| CI/CD | GitHub Actions |
| Container | Distroless Node.js |
| Helm | Helm 3 (OCI to Harbor) |

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 15+ (or CNPG operator in Kubernetes)
- A running minato control plane instance

### Installation

```bash
# Clone the repository
git clone https://github.com/7k-group/minato-ui.git
cd minato-ui

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Base URL of the application | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Yes |
| `AUTH_OIDC_ISSUER` | OIDC issuer URL | No |
| `AUTH_OIDC_CLIENT_ID` | OIDC client ID | No |
| `AUTH_OIDC_CLIENT_SECRET` | OIDC client secret | No |
| `CONTROL_PLANE_URL` | Default control plane URL | No |

## Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Run linter
npm run lint

# Run type checker
npm run typecheck

# Format code
npm run format
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t minato-ui .

# Run container
docker run -p 3000:3000 minato-ui
```

### Helm

```bash
# Add Helm repository (if published)
helm repo add minato-ui oci://harbor.7kgroup.org/7kminato

# Install chart
helm install minato-ui minato-ui/minato-ui \
  --set app.auth.oidc.enabled=true \
  --set app.auth.oidc.issuer=https://auth.example.com \
  --set app.auth.oidc.clientId=my-client-id
```

### Kubernetes with CNPG

The Helm chart includes a CloudNativePG (CNPG) cluster for PostgreSQL high availability.

```bash
# Install with CNPG
helm install minato-ui ./deploy/helm/minato-ui \
  --namespace minato \
  --create-namespace
```

## API Integration

The UI communicates with minato control planes via a BFF (Backend-for-Frontend) proxy pattern. The user's authentication token is forwarded to the control plane, which remains the single source of truth for RBAC.

### OpenAPI Specification

The control plane API is documented in the [minato repository](https://github.com/7k-group/minato/blob/main/api/openapi.yaml).

## Project Structure

```
minato-ui/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # BFF API routes
│   ├── layout.tsx         # Root layout with ThemeProvider
│   └── globals.css        # Global styles + 7k-design-system
├── components/            # Reusable components
├── lib/                   # Utilities (auth, prisma, api-client)
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── stores/                # Zustand stores
├── tests/                 # Test files
├── prisma/                # Database schema and migrations
├── deploy/helm/           # Helm chart
├── Dockerfile             # Multi-stage Docker build
└── .github/workflows/     # CI/CD pipelines
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)

## Support

For support, please open an issue on GitHub or contact the 7K Group team.
