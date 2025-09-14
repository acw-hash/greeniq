# GreenCrew Technical Implementation Plan - Next.js Full-Stack Architecture

This document serves as the authoritative implementation guide for Cursor AI to build the GreenCrew platform using Next.js 14 App Router with Supabase backend. This plan ensures architectural integrity, rapid development, and zero-tolerance for functional errors.

## 🗂️ Architecture Overview

- **Framework**: Next.js 14 (App Router) - Full-stack React framework
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with JWT and OAuth providers
- **Deployment**: Vercel with custom domain migration from AWS
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand + TanStack Query
- **Payments**: Stripe Connect for marketplace functionality
- **Real-time**: Supabase Realtime subscriptions

## 📁 Project Structure (Monorepo)

```
greencrew/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   ├── golf-course/
│   │   │   │   └── page.tsx
│   │   │   ├── professional/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   └── loading.tsx
│   │   ├── applications/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── edit/
│   │   │       └── page.tsx
│   │   ├── messages/
│   │   │   ├── page.tsx
│   │   │   └── [jobId]/
│   │   │       └── page.tsx
│   │   ├── payments/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── admin/                    # Admin routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/
│   │   ├── jobs/
│   │   └── analytics/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   ├── callback/route.ts
│   │   │   └── signout/route.ts
│   │   ├── jobs/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── search/route.ts
│   │   ├── applications/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── messages/
│   │   │   ├── route.ts
│   │   │   └── [jobId]/route.ts
│   │   ├── payments/
│   │   │   ├── create-intent/route.ts
│   │   │   ├── confirm/route.ts
│   │   │   └── webhooks/route.ts
│   │   ├── reviews/
│   │   │   └── route.ts
│   │   ├── certifications/
│   │   │   ├── route.ts
│   │   │   └── verify/route.ts
│   │   └── admin/
│   │       ├── users/route.ts
│   │       └── analytics/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── jobs/
│   │   ├── JobCard.tsx
│   │   ├── JobForm.tsx
│   │   ├── JobList.tsx
│   │   ├── JobSearch.tsx
│   │   └── JobMap.tsx
│   ├── messages/
│   │   ├── MessageThread.tsx
│   │   ├── MessageInput.tsx
│   │   └── MessageList.tsx
│   ├── profile/
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileForm.tsx
│   │   └── CertificationUpload.tsx
│   ├── payments/
│   │   ├── PaymentForm.tsx
│   │   └── PaymentHistory.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Navigation.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/                          # Utilities and configurations
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useJobs.ts
│   │   ├── useMessages.ts
│   │   └── usePayments.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── jobStore.ts
│   │   └── uiStore.ts
│   └── validations/
│       ├── auth.ts
│       ├── jobs.ts
│       ├── profile.ts
│       └── payments.ts
├── types/
│   ├── database.ts              # Supabase generated types
│   ├── auth.ts
│   ├── jobs.ts
│   └── global.ts
├── middleware.ts                # Route protection
├── tailwind.config.js
├── next.config.js
├── package.json
└── supabase/
    ├── config.toml
    ├── seed.sql
    └── migrations/
```

## 🗄️ Database Schema (Supabase PostgreSQL)

### Core Tables

```sql
-- Enable required extensions
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_type text CHECK (user_type IN ('golf_course', 'professional', 'admin')),
  full_name text,
  email text,
  phone text,
  location point,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Golf course profiles
CREATE TABLE golf_course_profiles (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  course_name text NOT NULL,
  course_type text CHECK (course_type IN ('public', 'private', 'resort', 'municipal')),
  address text NOT NULL,
  description text,
  facilities jsonb DEFAULT '{}',
  preferred_qualifications text[] DEFAULT '{}',
  stripe_account_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Professional profiles
CREATE TABLE professional_profiles (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio text,
  experience_level text CHECK (experience_level IN ('entry', 'intermediate', 'expert')),
  specializations text[] DEFAULT '{}',
  equipment_skills text[] DEFAULT '{}',
  hourly_rate decimal(10,2),
  travel_radius integer DEFAULT 25,
  rating decimal(3,2) DEFAULT 0,
  total_jobs integer DEFAULT 0,
  stripe_account_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Jobs
CREATE TABLE jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  job_type text NOT NULL,
  location point NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  hourly_rate decimal(10,2) NOT NULL,
  required_certifications text[] DEFAULT '{}',
  required_experience text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  urgency_level text DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'high', 'emergency')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Applications
CREATE TABLE applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  proposed_rate decimal(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(job_id, professional_id)
);

-- Messages
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Reviews
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  punctuality_rating integer CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(job_id, reviewer_id, reviewee_id)
);

-- Certifications
CREATE TABLE certifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  certification_type text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date,
  expiry_date date,
  document_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Payments
CREATE TABLE payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  platform_fee decimal(10,2) NOT NULL,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Notifications
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_course_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, users can update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Jobs: Public read, golf courses can create/update own
CREATE POLICY "Jobs are viewable by everyone" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Golf courses can create jobs" ON jobs
  FOR INSERT WITH CHECK (
    auth.uid() = course_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'golf_course')
  );

CREATE POLICY "Golf courses can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = course_id);

-- Applications: Viewable by job poster and applicant
CREATE POLICY "Applications viewable by involved parties" ON applications
  FOR SELECT USING (
    auth.uid() = professional_id OR 
    auth.uid() IN (SELECT course_id FROM jobs WHERE id = job_id)
  );

CREATE POLICY "Professionals can create applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = professional_id);

-- Messages: Viewable by job participants
CREATE POLICY "Messages viewable by job participants" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() IN (
      SELECT course_id FROM jobs WHERE id = job_id
      UNION
      SELECT professional_id FROM applications WHERE job_id = messages.job_id AND status = 'accepted'
    )
  );

-- Function to find jobs within distance (FIXED)
CREATE OR REPLACE FUNCTION jobs_within_distance(
  lat FLOAT,
  lng FLOAT,
  radius_km INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    ST_Distance(
      ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
      ST_GeogFromText('POINT(' || ST_X(j.location) || ' ' || ST_Y(j.location) || ')')
    ) / 1000 AS distance_km
  FROM jobs j
  WHERE ST_DWithin(
    ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
    ST_GeogFromText('POINT(' || ST_X(j.location) || ' ' || ST_Y(j.location) || ')'),
    radius_km * 1000
  )
  AND j.status = 'open'
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update professional rating
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE professional_profiles
  SET 
    rating = (
      SELECT AVG(overall_rating)::DECIMAL(3,2)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_jobs = (
      SELECT COUNT(*)
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.professional_id = NEW.reviewee_id
      AND j.status = 'completed'
    )
  WHERE profile_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();
```

## 🔧 Implementation Phase Plan

### Phase 1: Foundation & Authentication (Days 1-3)

**Objective**: Set up project structure and complete authentication system

#### Tasks:
1. **Project Setup**
   - Initialize Next.js 14 project with App Router
   - Configure Tailwind CSS and shadcn/ui
   - Set up TypeScript configuration
   - Initialize Supabase project and configure environment variables

2. **Authentication System**
   - Implement Supabase Auth integration
   - Create auth context and hooks
   - Build login/signup forms with validation
   - Set up OAuth providers (Google, Apple)
   - Implement route protection middleware

3. **Database Setup**
   - Create database schema in Supabase
   - Set up Row Level Security policies
   - Generate TypeScript types from database
   - Create seed data for development

4. **Core Components**
   - Set up shadcn/ui component library
   - Create layout components (Header, Navigation, Footer)
   - Implement responsive design system
   - Build error boundaries and loading states

### Phase 2: User Profiles & Job Management (Days 4-7)

**Objective**: Core marketplace functionality with job posting and discovery

#### Tasks:
1. **Profile Management**
   - Build profile forms for golf courses and professionals
   - Implement file upload for avatars and documents
   - Create profile display components
   - Add profile completion tracking

2. **Job Posting System**
   - Create job posting form with validation
   - Implement location selection with maps
   - Add job categorization and requirements
   - Build job preview and editing functionality

3. **Job Discovery**
   - Create job listing page with filtering and search
   - Implement real-time job updates with Supabase subscriptions
   - Add location-based job matching
   - Build job detail pages with application functionality

4. **Application System**
   - Create job application forms
   - Implement application status tracking
   - Add application management for golf courses
   - Build notification system for application updates

### Phase 3: Real-Time Communication (Days 8-10)

**Objective**: Seamless messaging and notification system

#### Tasks:
1. **Real-Time Messaging**
   - Implement Supabase Realtime subscriptions
   - Build message thread components
   - Add file and image sharing capabilities
   - Create typing indicators and read receipts

2. **Notification System**
   - Set up in-app notifications
   - Implement email notifications with Resend
   - Add push notification support
   - Build notification preferences management

3. **Communication Features**
   - Create job-specific chat rooms
   - Add message search and filtering
   - Implement message status tracking
   - Build conversation archiving

### Phase 4: Payment Processing (Days 11-14)

**Objective**: Complete Stripe Connect integration with escrow functionality

#### Tasks:
1. **Stripe Connect Setup**
   - Implement Stripe Connect onboarding
   - Create payment account verification
   - Build payout management system
   - Add bank account verification

2. **Payment Processing**
   - Create payment intent system
   - Implement escrow functionality
   - Add automatic payment release
   - Build payment dispute handling

3. **Transaction Management**
   - Create payment history tracking
   - Implement receipt generation
   - Add tax documentation (1099s)
   - Build refund and chargeback handling

### Phase 5: Trust & Safety (Days 15-18)

**Objective**: Verification and safety systems

#### Tasks:
1. **Document Verification**
   - Build certification upload system
   - Implement admin verification workflow
   - Add document expiration tracking
   - Create verification badges

2. **Background Checks**
   - Integrate Checkr API
   - Implement verification status tracking
   - Add compliance monitoring
   - Build verification reporting

3. **Safety Features**
   - Create user reporting system
   - Implement content moderation
   - Add safety guidelines
   - Build incident tracking

### Phase 6: Advanced Features (Days 19-22)

**Objective**: Enhanced user experience and business features

#### Tasks:
1. **Maps Integration**
   - Integrate Google Maps API
   - Build interactive job map
   - Add driving distance calculations
   - Implement location-based search

2. **Analytics & Reporting**
   - Create user analytics dashboard
   - Implement business metrics tracking
   - Add performance monitoring
   - Build admin analytics panel

3. **Advanced Search**
   - Implement full-text search
   - Add saved search functionality
   - Create recommendation engine
   - Build advanced filtering

### Phase 7: Admin & Moderation (Days 23-26)

**Objective**: Platform management and oversight tools

#### Tasks:
1. **Admin Dashboard**
   - Build comprehensive admin interface
   - Create user management tools
   - Implement job moderation system
   - Add platform analytics

2. **Content Moderation**
   - Create automated content filtering
   - Build manual review system
   - Implement user reporting
   - Add safety incident management

3. **Business Intelligence**
   - Create revenue analytics
   - Build user behavior tracking
   - Implement conversion funnels
   - Add marketplace health metrics

### Phase 8: Optimization & Launch (Days 27-30)

**Objective**: Performance optimization and production readiness

#### Tasks:
1. **Performance Optimization**
   - Implement caching strategies
   - Optimize database queries
   - Add image optimization
   - Build performance monitoring

2. **Security Audit**
   - Conduct security review
   - Implement penetration testing
   - Add security monitoring
   - Build incident response

3. **Launch Preparation**
   - Set up production environment
   - Configure monitoring and alerting
   - Implement backup and recovery
   - Create deployment pipeline

---

## 🔒 Security & Compliance

### Authentication Security
- JWT-based authentication with secure refresh tokens
- OAuth integration with Google, Apple, GitHub
- Email verification requirements
- Strong password policies with complexity requirements
- Two-factor authentication support

### Data Protection
- Row Level Security (RLS) for all database operations
- API request validation using Zod schemas
- Input sanitization and XSS protection
- CSRF protection with proper headers
- Encrypted storage for sensitive data

### Payment Security
- PCI DSS compliance through Stripe
- Secure tokenization of payment methods
- No storage of sensitive payment data
- Fraud detection and prevention
- Secure webhook validation

### Infrastructure Security
- HTTPS enforcement across all endpoints
- Secure environment variable management
- Regular security updates and patches
- Audit logging for sensitive operations
- Rate limiting and DDoS protection

---

## 📊 Monitoring & Analytics

### Error Tracking
```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})

export { Sentry }
```

### Performance Monitoring
```typescript
// lib/analytics/vercel.ts
import { Analytics } from '@vercel/analytics/react'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  )
}
```

### User Analytics
```typescript
// lib/analytics/posthog.ts
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  })
}

export { posthog }
```

---

## 🧪 Testing Strategy

### Unit Testing
```typescript
// __tests__/components/JobCard.test.tsx
import { render, screen } from '@testing-library/react'
import { JobCard } from '@/components/jobs/JobCard'
import { mockJob } from '@/lib/test-utils/mocks'

describe('JobCard', () => {
  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />)
    expect(screen.getByText(mockJob.title)).toBeInTheDocument()
  })
})
```

### Integration Testing
```typescript
// __tests__/api/jobs.test.ts
import { POST } from '@/app/api/jobs/route'
import { createMockRequest } from '@/lib/test-utils'

describe('/api/jobs', () => {
  it('creates a job successfully', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { title: 'Test Job', job_type: 'greenskeeping' }
    })
    
    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

### End-to-End Testing
```typescript
// e2e/job-posting.spec.ts
import { test, expect } from '@playwright/test'

test('golf course can post a job', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid=email]', 'golf@example.com')
  await page.fill('[data-testid=password]', 'password')
  await page.click('[data-testid=login-button]')
  
  await page.goto('/jobs/create')
  await page.fill('[data-testid=job-title]', 'Test Job')
  await page.click('[data-testid=submit-job]')
  
  await expect(page.locator('[data-testid=job-success]')).toBeVisible()
})
```

---

## 🚀 Deployment Configuration

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
RESEND_API_KEY=your_resend_key
CHECKR_API_KEY=your_checkr_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
```

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Domain Migration
1. **Add domain in Vercel dashboard**
2. **Update DNS records in AWS Route 53**:
   ```
   A Record: @ → 76.76.19.61
   CNAME: www → cname.vercel-dns.com
   ```
3. **Verify SSL certificate provisioning**
4. **Test domain propagation (24-48 hours)**

---

## 📋 Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict mode enabled with comprehensive type coverage
- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Consistent code formatting across the project
- **Husky**: Pre-commit hooks for linting and testing
- **Conventional Commits**: Standardized commit message format

### Component Development
- **Atomic Design**: Structure components as atoms, molecules, organisms
- **shadcn/ui**: Use as the base component library
- **Accessibility**: WCAG 2.1 AA compliance for all components
- **Performance**: Lazy loading and code splitting where appropriate
- **Testing**: Unit tests for all components

### API Development
- **REST Principles**: RESTful API design with proper HTTP methods
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Authentication**: JWT-based authentication for protected routes
- **Rate Limiting**: Implement rate limiting for API endpoints

---

## 🎯 Success Metrics

### Technical Metrics
- **Page Load Time**: <2 seconds (Core Web Vitals)
- **API Response Time**: <300ms (95th percentile)
- **Error Rate**: <0.1% of requests
- **Uptime**: 99.9% availability
- **Test Coverage**: >80% code coverage

### Business Metrics
- **User Registration**: 500+ users in first month
- **Job Postings**: 100+ jobs posted in first month
- **Applications**: 50% application-to-job ratio
- **Transactions**: $10K+ in monthly transaction volume
- **User Retention**: 60% monthly active users

---

## 🔄 Cursor Implementation Instructions

### Critical Requirements
1. **Follow this plan exactly** - Do not deviate from the specified architecture
2. **Use provided database schema** - Implement exactly as specified
3. **Implement all security measures** - RLS policies, validation, authentication
4. **Build complete features** - No placeholder or incomplete functionality
5. **Include comprehensive error handling** - Graceful degradation and user feedback

### Implementation Order
1. **Start with Phase 1** - Foundation and authentication
2. **Complete each phase fully** - Do not move to next phase until current is complete
3. **Test thoroughly** - Implement unit tests for all components and API routes
4. **Document as you build** - Clear comments and documentation
5. **Follow TypeScript best practices** - Strict typing throughout

### Quality Assurance
- All components must be fully functional
- All API routes must include proper validation
- All database operations must use RLS
- All forms must include client and server validation
- All real-time features must handle connection errors

This technical implementation plan provides a comprehensive roadmap for building GreenCrew using Next.js 14 with Supabase, ensuring a robust, scalable, and secure marketplace platform.
   