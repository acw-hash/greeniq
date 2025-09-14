# GreenCrew Technical Roadmap – Next.js Full-Stack Architecture

## Context

GreenCrew is a vertically integrated gig marketplace tailored specifically for golf course maintenance jobs. The platform uses a modern Next.js 14 full-stack architecture with Supabase for database and authentication, deployed on Vercel with automatic custom domain configuration.

**Technology Stack:**
- **Frontend + Backend**: Next.js 14 (App Router) with API routes
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth (JWT with OAuth providers)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel with custom domain migration from AWS
- **Payments**: Stripe Connect for marketplace transactions
- **File Storage**: Supabase Storage with CDN

---

## Deployment & Domain Configuration

- ✅ Next.js application deployed on Vercel
- ✅ Custom .com domain migrated from AWS to Vercel DNS
- ✅ Automatic SSL certificate management
- ✅ Global CDN for optimal performance
- 📦 **Future Scaling**:
  - 🌍 Multi-region deployment if user load exceeds 100k/month
  - 🚀 Edge functions for location-based features

---

## Phase 1: Core Authentication & User Management (Day 1–3)

**Objective**: Complete user onboarding and profile management system

### Authentication System
- Implement Supabase Auth with email/password and OAuth (Google, Apple)
- Set up protected routes with middleware
- Create auth context and hooks for session management
- Build custom login/signup forms with form validation

### User Profile System
- Extend Supabase auth.users with custom profiles table
- Implement role-based access control (golf_course, professional, admin)
- Build profile completion flows with step-by-step wizards
- Add profile image upload with Supabase Storage

### Data Models
```sql
-- Profiles table extending Supabase auth
profiles: id (uuid), user_type (enum), full_name, email, phone, location (point), is_verified
golf_course_profiles: profile_id, course_name, course_type, address, description, facilities (jsonb)
professional_profiles: profile_id, bio, experience_level, specializations (array), hourly_rate, rating
```

### API Routes
- `POST /api/auth/profile` - Create/update profile
- `GET /api/profiles/[id]` - Get profile by ID
- `PUT /api/profiles/[id]` - Update profile
- `DELETE /api/profiles/[id]` - Delete account

---

## Phase 2: Job Marketplace Engine (Day 4–7)

**Objective**: Core job posting, discovery, and application system

### Job Management System
- Build job posting form with dynamic fields based on job type
- Implement job search with filters (location, pay rate, job type, certifications)
- Add real-time job updates using Supabase subscriptions
- Create job detail pages with application functionality

### Application System
- Build application form with cover letter and rate negotiation
- Implement application status tracking (pending, accepted, rejected)
- Add bulk application management for golf courses
- Create notification system for application updates

### Data Models
```sql
jobs: id, course_id, title, description, job_type, location (point), start_date, end_date, hourly_rate, required_certifications (array), status
applications: id, job_id, professional_id, message, proposed_rate, status, applied_at
```

### API Routes
- `GET /api/jobs` - List jobs with filtering
- `POST /api/jobs` - Create new job
- `GET /api/jobs/[id]` - Get job details
- `PUT /api/jobs/[id]` - Update job
- `POST /api/applications` - Submit job application
- `GET /api/applications` - List user applications

### Matching Algorithm
- Implement location-based matching using PostGIS
- Add certification requirement matching
- Create recommendation system based on profile data
- Build job alert system with email notifications

---

## Phase 3: Real-Time Communication (Day 8–10)

**Objective**: Seamless communication between golf courses and professionals

### Messaging System
- Implement real-time messaging using Supabase Realtime
- Build chat interface with job-specific conversation threads
- Add file and image sharing capabilities
- Create message status indicators (sent, delivered, read)

### Notification System
- Set up push notifications for new messages
- Build in-app notification center
- Add email notifications for important updates
- Implement notification preferences and settings

### Data Models
```sql
messages: id, job_id, sender_id, content, message_type (text/image/file), metadata (jsonb), created_at
notifications: id, user_id, type, title, message, read_at, created_at
```

### API Routes
- `GET /api/messages/[jobId]` - Get job messages
- `POST /api/messages` - Send new message
- `POST /api/messages/upload` - Upload message attachments
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/[id]/read` - Mark notification as read

---

## Phase 4: Payment Processing & Reviews (Day 11–14)

**Objective**: Secure escrow payments and quality assurance system

### Stripe Connect Integration
- Set up Stripe Connect for marketplace payments
- Implement onboarding flow for payment accounts
- Build escrow system with automatic release on job completion
- Add payout management and transaction history

### Review System
- Create post-job review forms with category ratings
- Implement bidirectional rating system
- Add photo upload for work documentation
- Build review display and aggregation system

### Data Models
```sql
payments: id, job_id, payer_id, payee_id, amount, platform_fee, stripe_payment_intent_id, status
reviews: id, job_id, reviewer_id, reviewee_id, overall_rating, quality_rating, communication_rating, punctuality_rating, comment
```

### API Routes
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get transaction history
- `POST /api/reviews` - Submit review
- `GET /api/reviews/[userId]` - Get user reviews

### Stripe Webhooks
- Handle payment confirmations and failures
- Process automatic payouts on job completion
- Manage dispute and refund processes

---

## Phase 5: Trust & Safety Features (Day 15–18)

**Objective**: Verification and safety systems for platform integrity

### Certification System
- Build document upload system for certifications
- Implement admin verification workflow
- Add expiration tracking and renewal reminders
- Create certification badge display system

### Background Checks
- Integrate with background check services (Checkr API)
- Implement verification status tracking
- Add insurance document verification
- Build compliance monitoring system

### Data Models
```sql
certifications: id, professional_id, certification_type, issuing_organization, issue_date, expiry_date, document_url, verification_status
background_checks: id, professional_id, status, report_url, completed_at
```

### API Routes
- `POST /api/certifications` - Upload certification
- `PUT /api/certifications/[id]/verify` - Admin verification
- `POST /api/background-checks/initiate` - Start background check
- `GET /api/background-checks/status` - Check verification status

---

## Phase 6: Geographic Features & Discovery (Day 19–22)

**Objective**: Location-based job discovery and mapping

### Interactive Mapping
- Integrate Google Maps API for job location display
- Build interactive job discovery map
- Add distance-based filtering and sorting
- Implement driving distance calculations

### Location Services
- Add GPS-based job discovery
- Implement location-based notifications
- Build service area management for professionals
- Add location verification for job check-ins

### API Routes
- `GET /api/jobs/nearby` - Get jobs by location
- `POST /api/jobs/search-radius` - Search within radius
- `GET /api/locations/distance` - Calculate distances
- `POST /api/locations/verify` - Verify job location

---

## Phase 7: Admin Panel & Analytics (Day 23–26)

**Objective**: Platform management and business intelligence

### Admin Dashboard
- Build comprehensive admin interface
- Add user management and moderation tools
- Implement job and payment monitoring
- Create platform analytics and reporting

### Content Moderation
- Add automated content filtering
- Build manual review system for flagged content
- Implement user reporting and response system
- Create safety incident tracking

### Data Models
```sql
admin_actions: id, admin_id, action_type, target_id, reason, created_at
reports: id, reporter_id, reported_id, report_type, description, status, created_at
```

### API Routes
- `GET /api/admin/users` - User management
- `GET /api/admin/jobs` - Job moderation
- `GET /api/admin/analytics` - Platform metrics
- `POST /api/admin/actions` - Admin actions

---

## Phase 8: Performance & Scaling (Day 27–30+)

**Objective**: Optimization for production-level performance

### Performance Optimization
- Implement Next.js optimization features (Image, Font optimization)
- Add database query optimization with proper indexing
- Implement client-side caching with TanStack Query
- Add real-time performance monitoring

### Scaling Preparation
- Set up database connection pooling
- Implement rate limiting for API routes
- Add comprehensive error boundaries and logging
- Prepare for multi-region deployment

### Monitoring & Observability
- Integrate Sentry for error tracking
- Set up Vercel Analytics for performance monitoring
- Add custom metrics and alerting
- Implement health check endpoints

---

## File Structure & Organization

```
greencrew/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx
│   │   │   ├── create/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── applications/page.tsx
│   │   ├── profile/page.tsx
│   │   └── messages/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── jobs/
│   │   ├── applications/
│   │   ├── messages/
│   │   ├── payments/
│   │   ├── reviews/
│   │   ├── certifications/
│   │   └── admin/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── auth/
│   ├── jobs/
│   ├── messages/
│   ├── profile/
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── stripe/
│   ├── utils/
│   └── validations/
├── hooks/
├── store/
├── types/
└── middleware.ts
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
CHECKR_API_KEY=your_checkr_api_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
POSTHOG_API_KEY=your_posthog_key
```

---

## Deployment Configuration

### Vercel Deployment
- Automatic deployments from GitHub main branch
- Environment variable management in Vercel dashboard
- Custom domain configuration with DNS migration
- Serverless function optimization

### Domain Migration Steps
1. Update DNS records to point to Vercel:
   - A record: `@` → `76.76.19.61`
   - CNAME: `www` → `cname.vercel-dns.com`
2. Verify domain ownership in Vercel dashboard
3. Enable automatic SSL certificate provisioning
4. Test domain propagation (24-48 hours)

---

## Success Metrics & Monitoring

### Technical Metrics
- Page load time: <2 seconds (Core Web Vitals)
- API response time: <300ms (95th percentile)
- Database query performance: <100ms average
- Real-time message latency: <500ms
- Error rate: <0.1% of requests

### Business Metrics
- User registration conversion: 15% of visitors
- Job posting to application ratio: 3:1
- Average job completion time: 24 hours
- Platform transaction volume: $100K/month
- User retention rate: 60% at 30 days

---

## Development Workflow

### Local Development
1. Clone repository and install dependencies
2. Set up Supabase project and configure environment variables
3. Run database migrations and seed data
4. Start development server: `npm run dev`
5. Access at `http://localhost:3000`

### Code Quality
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Husky pre-commit hooks
- Comprehensive test coverage (>80%)
- Automated dependency updates

### Deployment Pipeline
1. Feature development in feature branches
2. Pull request with automated testing
3. Code review and approval
4. Merge to main triggers automatic Vercel deployment
5. Post-deployment monitoring and validation

This roadmap provides a comprehensive implementation plan for building GreenCrew using modern Next.js architecture with Supabase, optimized for rapid development and scalable growth.