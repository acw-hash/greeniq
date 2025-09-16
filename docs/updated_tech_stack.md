# GreenIQ Technology Stack - Next.js Full-Stack Architecture

## Executive Summary

This technology stack leverages **Next.js 14 App Router** for a unified full-stack development experience with **Supabase** as the backend-as-a-service. The architecture prioritizes **rapid development**, **type safety**, and **cost-effective scaling** while providing enterprise-grade features.

**Estimated Monthly Cost (MVP Phase)**: $50-150/month
**Estimated Monthly Cost (Growth Phase)**: $300-800/month

---

## Core Architecture

### Full-Stack Framework
**Next.js 14** (App Router)
- **Rationale**: 
  - Unified frontend and backend in single codebase
  - Server-side rendering for SEO optimization
  - Built-in API routes eliminate separate backend setup
  - Automatic code splitting and optimization
  - TypeScript-first development experience
- **Cost**: Free (open source)

### Database & Backend Services
**Supabase** (PostgreSQL + Real-time + Auth + Storage)
- **Rationale**:
  - Managed PostgreSQL with real-time subscriptions
  - Built-in authentication with JWT and OAuth
  - Row Level Security (RLS) for data protection
  - File storage with CDN integration
  - Generous free tier: 500MB database, 1GB storage, 2GB bandwidth
- **Cost**: $0-25/month initially, scales with usage

### Deployment Platform
**Vercel** 
- **Rationale**:
  - Seamless Next.js integration and optimization
  - Global CDN with edge functions
  - Automatic deployments from Git
  - Custom domain support with SSL
  - Generous free tier: 100GB bandwidth, unlimited functions
- **Cost**: $0-20/month initially

---

## Frontend Technology Stack

### UI Framework & Styling
**React 18** + **Tailwind CSS** + **shadcn/ui**
- **Rationale**:
  - React 18 with concurrent features and streaming SSR
  - Tailwind for rapid, consistent styling
  - shadcn/ui for accessible, customizable components
  - No runtime CSS-in-JS overhead
- **Cost**: Free

### State Management
**Zustand** + **TanStack Query (React Query)**
- **Rationale**:
  - Zustand: Lightweight, simple global state management
  - TanStack Query: Server state management with caching
  - Combined: Complete state solution without complexity
  - TypeScript-first design
- **Cost**: Free

### Real-time Communication
**Supabase Realtime**
- **Rationale**:
  - WebSocket-based real-time subscriptions
  - Automatic reconnection and error handling
  - Integrated with database changes
  - No separate messaging infrastructure needed
- **Cost**: Included with Supabase

---

## Backend Architecture

### API Layer
**Next.js API Routes** (App Router)
- **Rationale**:
  - RESTful endpoints with TypeScript validation
  - Server-side rendering capabilities
  - Integrated with frontend for type safety
  - Edge runtime support for global performance
- **Cost**: Free (included with Next.js)

### Database
**PostgreSQL** (via Supabase)
- **Rationale**:
  - ACID compliance for transactional data
  - PostGIS extension for geospatial queries
  - Full-text search capabilities
  - Row Level Security for data protection
- **Cost**: Included with Supabase

### Authentication
**Supabase Auth**
- **Rationale**:
  - JWT-based authentication with refresh tokens
  - OAuth providers (Google, Apple, GitHub)
  - Email/password with verification
  - Row Level Security integration
- **Cost**: Included with Supabase

### File Storage
**Supabase Storage**
- **Rationale**:
  - S3-compatible object storage
  - Automatic image optimization and resizing
  - CDN integration for global delivery
  - RLS policies for secure file access
  - Built-in virus scanning
- **Cost**: Included with Supabase (1GB free, then $0.021/GB)

---

## Payment Processing

### Marketplace Payments
**Stripe Connect**
- **Rationale**:
  - Purpose-built for marketplace platforms
  - Escrow functionality for job-based payments
  - Automatic payouts to professionals
  - 10% platform fee handling
  - Comprehensive fraud protection
- **Cost**: 2.9% + 30¢ per transaction

### Payment Features
- Automatic escrow on job acceptance
- Release payments on job completion
- Platform fee collection (10%)
- 1099 tax document generation
- Dispute handling and chargebacks

---

## External Services

### Maps & Location
**Google Maps Platform**
- **Rationale**:
  - Most accurate location data and geocoding
  - Driving distance and time calculations
  - Interactive map components
  - $200/month free credit covers MVP usage
- **Cost**: $0-100/month initially

### Communication
**Resend** (Email) + **Twilio** (SMS)
- **Rationale**:
  - Resend: Developer-focused with excellent deliverability
  - Twilio: Reliable SMS for verification and notifications
  - Both offer generous free tiers
- **Cost**: $0-30/month initially

### Background Checks
**Checkr API**
- **Rationale**:
  - API-first background verification
  - Fast turnaround times (24-72 hours)
  - Comprehensive screening options
  - Pay-per-check pricing model
- **Cost**: $35-50 per background check

### Monitoring & Analytics
**Vercel Analytics** + **Sentry** + **PostHog**
- **Rationale**:
  - Vercel Analytics: Built-in performance monitoring
  - Sentry: Error tracking and performance monitoring
  - PostHog: User analytics and feature flags
  - All offer generous free tiers
- **Cost**: $0-50/month initially

---

## Development Tools & Workflow

### Version Control & CI/CD
**GitHub** + **GitHub Actions**
- **Rationale**:
  - Free private repositories
  - 2,000 CI/CD minutes per month free
  - Integrated with Vercel for automatic deployments
  - Dependabot for automated dependency updates
- **Cost**: $0

### Code Quality
**TypeScript** + **ESLint** + **Prettier**
- **Rationale**:
  - End-to-end type safety
  - Automated code formatting and linting
  - Integrated with Next.js and Vercel
- **Cost**: Free

### Testing Framework
**Vitest** + **Playwright** + **React Testing Library**
- **Rationale**:
  - Vitest: Fast unit testing with native TypeScript support
  - Playwright: Reliable E2E testing across browsers
  - React Testing Library: Component testing best practices
- **Cost**: Free

---

## Cost Analysis

### MVP Phase (0-1,000 users)
| Service | Monthly Cost |
|---------|-------------|
| Vercel (Hosting) | $0 |
| Supabase (Database/Auth) | $0 |
| Google Maps | $0 (free credits) |
| Resend (Email) | $0 |
| Sentry (Error tracking) | $0 |
| Domain registration | $12 |
| **Total** | **$12/month** |

### Growth Phase (1,000-10,000 users)
| Service | Monthly Cost |
|---------|-------------|
| Vercel (Pro plan) | $20 |
| Supabase (Pro plan) | $25 |
| Google Maps | $100 |
| Resend (Email service) | $20 |
| Sentry (Team plan) | $26 |
| PostHog (Analytics) | $20 |
| Twilio (SMS) | $50 |
| Background checks | $200 |
| **Total** | **$461/month** |

### Scale Phase (10,000+ users)
| Service | Monthly Cost |
|---------|-------------|
| Vercel (Enterprise) | $400 |
| Supabase (Team/Org) | $100 |
| Google Maps | $300 |
| Resend | $50 |
| Sentry | $80 |
| PostHog | $100 |
| Twilio | $200 |
| Background checks | $800 |
| **Total** | **$2,030/month** |

---

## Architecture Benefits

### Development Velocity
- **Single codebase**: Frontend and backend in one repository
- **Type safety**: End-to-end TypeScript with shared types
- **Real-time by default**: Supabase subscriptions for live updates
- **No DevOps overhead**: Managed services handle infrastructure

### Scalability
- **Serverless architecture**: Automatic scaling with Vercel and Supabase
- **Global CDN**: Fast performance worldwide
- **Database scaling**: Supabase handles connection pooling and read replicas
- **Edge functions**: Run code close to users globally

### Cost Efficiency
- **Generous free tiers**: Most services free during MVP phase
- **Pay-as-you-scale**: Costs grow with usage and revenue
- **No idle costs**: Serverless means no charges for unused capacity
- **Consolidated billing**: Fewer vendors to manage

---

## File Structure

```
greeniq/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected routes
│   ├── api/                      # API endpoints
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   ├── auth/
│   ├── jobs/
│   ├── messages/
│   └── layout/
├── lib/                          # Utilities and configurations
│   ├── supabase/
│   ├── stripe/
│   ├── utils/
│   ├── hooks/
│   ├── stores/
│   └── validations/
├── types/                        # TypeScript definitions
├── middleware.ts                 # Route protection
├── tailwind.config.js
├── next.config.js
└── package.json
```

---

## Environment Configuration

### Development Environment
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
```

### Production Environment
- All environment variables managed in Vercel dashboard
- Automatic SSL certificate provisioning
- Custom domain configuration
- Environment variable encryption

---

## Domain Migration Strategy

### Current Setup
- Domain registered on AWS Route 53
- Need to point to Vercel for hosting

### Migration Steps
1. **Add domain in Vercel dashboard**
2. **Update DNS records**:
   ```
   A Record: @ → 76.76.19.61
   CNAME: www → cname.vercel-dns.com
   ```
3. **SSL certificate**: Automatically provisioned by Vercel
4. **Propagation time**: 24-48 hours
5. **Verification**: Test both www and apex domain

---

## Performance Optimization

### Next.js Optimizations
- **Automatic code splitting**: Smaller bundle sizes
- **Image optimization**: WebP conversion and lazy loading
- **Font optimization**: Self-hosted Google Fonts
- **Static generation**: Pre-build pages where possible

### Database Optimization
- **Proper indexing**: Optimized queries for location and search
- **Connection pooling**: Managed by Supabase
- **Read replicas**: Available in higher tiers
- **Query optimization**: Real-time query analysis

### Caching Strategy
- **Vercel Edge Cache**: Static assets and API responses
- **Browser caching**: Optimized cache headers
- **Database caching**: Query result caching
- **Real-time invalidation**: Cache updates on data changes

---

## Security Features

### Authentication Security
- **JWT tokens**: Secure, stateless authentication
- **OAuth integration**: Google, Apple, GitHub
- **Email verification**: Required for account activation
- **Password requirements**: Strong password enforcement

### Data Protection
- **Row Level Security**: Database-level access control
- **API validation**: Zod schema validation on all endpoints
- **HTTPS everywhere**: SSL/TLS encryption for all traffic
- **CORS configuration**: Proper cross-origin request handling

### File Security
- **Virus scanning**: Automatic malware detection
- **Access policies**: RLS for file access control
- **Content type validation**: Restricted file types
- **Size limits**: Prevent abuse and storage costs

---

## Monitoring & Observability

### Error Tracking
- **Sentry integration**: Automatic error capture and alerting
- **Performance monitoring**: Real user monitoring (RUM)
- **Release tracking**: Deploy-based error grouping
- **User context**: Enhanced error reporting with user data

### Analytics
- **User behavior**: PostHog event tracking
- **Performance metrics**: Core Web Vitals monitoring
- **Business metrics**: Custom dashboards for KPIs
- **A/B testing**: Feature flag management

### Alerting
- **Error rate alerts**: Automatic Slack/email notifications
- **Performance degradation**: Response time monitoring
- **Uptime monitoring**: Third-party service monitoring
- **Business metric alerts**: Custom threshold alerts

---

## Migration Path

### Phase 1: Foundation (Week 1-2)
- Set up Supabase project and database schema
- Create Next.js application with basic authentication
- Deploy to Vercel and configure custom domain
- Implement core job posting and discovery features

### Phase 2: Core Features (Week 3-4)
- Add real-time messaging system
- Implement Stripe Connect payment processing
- Build user profile management
- Add review and rating system

### Phase 3: Advanced Features (Week 5-6)
- Integrate Google Maps for location features
- Add background check verification
- Implement notification system
- Build admin dashboard

### Phase 4: Optimization (Week 7-8)
- Performance optimization and monitoring
- Security audit and penetration testing
- Load testing and scaling preparation
- Analytics implementation and business metrics

---

## Risk Mitigation

### Technical Risks
- **Vendor lock-in**: Use standard technologies (PostgreSQL, React)
- **Scaling limits**: Monitor usage and plan upgrades
- **Security vulnerabilities**: Regular security audits
- **Performance issues**: Implement comprehensive monitoring

### Business Risks
- **Cost escalation**: Usage monitoring and budget alerts
- **Service outages**: Multi-region deployment strategy
- **Data loss**: Automated backups and disaster recovery
- **Compliance issues**: GDPR and privacy compliance built-in

---

## Success Metrics

### Technical Metrics
- **Page load time**: <2 seconds (Core Web Vitals)
- **API response time**: <300ms (95th percentile)
- **Error rate**: <0.1% of requests
- **Uptime**: 99.9% availability

### Business Metrics
- **User growth**: 20% month-over-month
- **Transaction volume**: $100K+ monthly GMV
- **User engagement**: 60% monthly retention
- **Platform efficiency**: <5% customer support tickets

This technology stack provides a robust, scalable foundation for GreenIQ while maintaining cost efficiency and development velocity throughout the growth journey.
  