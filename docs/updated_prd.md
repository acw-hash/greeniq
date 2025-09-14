# GreenCrew Product Requirements Document

## Executive Summary

GreenCrew is an on-demand peer-to-peer platform that connects golf courses with certified turf and golf maintenance professionals. The platform addresses the critical need for flexible, qualified staffing in golf course maintenance by enabling golf courses to quickly find skilled greenskeepers and maintenance workers while providing professionals with flexible earning opportunities.

## Product Overview

### Vision Statement
To become the leading marketplace for golf course maintenance staffing, enabling seamless connections between golf facilities and skilled maintenance professionals while maintaining the highest standards of course quality and care.

### Mission Statement
GreenCrew empowers golf courses to maintain exceptional playing conditions through instant access to qualified maintenance professionals, while providing skilled workers with flexible, well-compensated opportunities in the golf industry.

## Technology Architecture

### Core Stack
- **Framework**: Next.js 14 (App Router) - Full-stack React framework
- **Database**: Supabase (PostgreSQL) - Real-time database with built-in auth
- **Authentication**: Supabase Auth - JWT-based with OAuth providers
- **Styling**: Tailwind CSS - Utility-first CSS framework
- **Deployment**: Vercel - Automatic deployments with custom domain
- **State Management**: Zustand + TanStack Query
- **Real-time**: Supabase Realtime subscriptions
- **Payments**: Stripe Connect - Marketplace payments with escrow

### Architecture Benefits
- **Rapid Development**: Single codebase for frontend and API routes
- **Type Safety**: End-to-end TypeScript implementation
- **Real-time Features**: Built-in with Supabase subscriptions
- **Scalability**: Serverless architecture with automatic scaling
- **Cost Efficiency**: Generous free tiers, pay-as-you-scale

## Core Features

### 1. Authentication & User Management
**Implementation**: Supabase Auth with custom profiles

**Golf Course Registration**
- Course information (name, type, location, contact)
- Business verification and documentation
- Payment method setup (Stripe Connect)
- Profile completion with facility photos

**Professional Registration**
- Personal information and work authorization
- Certification uploads and verification
- Equipment proficiency and specializations
- Portfolio and experience documentation
- Background check integration

### 2. Job Marketplace
**Implementation**: Supabase database with real-time subscriptions

**Job Posting (Golf Courses)**
- Job type selection (greenskeeping, equipment, irrigation, landscaping)
- Requirements specification (certifications, experience level)
- Scheduling and compensation details
- Location mapping and radius settings
- Instant professional matching and notifications

**Job Discovery (Professionals)**
- Real-time job feed with filtering
- Location-based search with map view
- Certification matching and recommendations
- Application system with custom messages
- Job status tracking and notifications

### 3. Communication System
**Implementation**: Supabase real-time messaging

**Real-time Messaging**
- Job-specific conversation threads
- File and photo sharing capabilities
- Read receipts and typing indicators
- Push notification integration
- Message history and search

### 4. Scheduling & Calendar
**Implementation**: Custom calendar with Supabase storage

**Availability Management**
- Professional availability calendar
- Job scheduling and conflict detection
- Multi-day project planning
- Recurring job templates
- Calendar export functionality

### 5. Payment & Escrow System
**Implementation**: Stripe Connect with marketplace features

**Payment Processing**
- Automatic escrow on job acceptance
- Milestone-based payments for longer projects
- Automatic release on job completion
- Dispute handling and refund processing
- Tax documentation and 1099 generation

### 6. Reviews & Ratings
**Implementation**: Supabase database with aggregation

**Bidirectional Rating System**
- Post-job rating requirements
- Category-based reviews (quality, punctuality, communication)
- Photo documentation of completed work
- Response system for addressing concerns
- Profile rating aggregation and display

### 7. Trust & Safety
**Implementation**: Document verification and background checks

**Verification System**
- Certification document upload and verification
- Background check integration (Checkr API)
- Insurance documentation tracking
- Profile verification badges
- Ongoing compliance monitoring

### 8. Geographic Features
**Implementation**: PostGIS with Google Maps integration

**Location Services**
- Interactive job mapping
- Distance-based filtering and matching
- Driving time calculations
- Geographic search optimization
- Mobile location services

## Database Schema (Supabase PostgreSQL)

### Core Tables

```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_type text CHECK (user_type IN ('golf_course', 'professional', 'admin')),
  full_name text,
  email text,
  phone text,
  location point,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Golf course specific profiles
CREATE TABLE golf_course_profiles (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  course_name text NOT NULL,
  course_type text CHECK (course_type IN ('public', 'private', 'resort', 'municipal')),
  address text NOT NULL,
  description text,
  facilities jsonb,
  preferred_qualifications text[],
  stripe_account_id text
);

-- Professional specific profiles  
CREATE TABLE professional_profiles (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio text,
  experience_level text CHECK (experience_level IN ('entry', 'intermediate', 'expert')),
  specializations text[],
  equipment_skills text[],
  hourly_rate decimal(10,2),
  travel_radius integer DEFAULT 25,
  rating decimal(3,2) DEFAULT 0,
  total_jobs integer DEFAULT 0,
  stripe_account_id text
);

-- Job postings
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
  required_certifications text[],
  required_experience text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Job applications
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

-- Reviews and ratings
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

-- Messages
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
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
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_course_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Jobs: Public read, authenticated users can create
CREATE POLICY "Jobs are viewable by everyone" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Golf courses can create jobs" ON jobs
  FOR INSERT WITH CHECK (
    auth.uid() = course_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'golf_course')
  );

-- Applications: Viewable by job poster and applicant
CREATE POLICY "Applications viewable by involved parties" ON applications
  FOR SELECT USING (
    auth.uid() = professional_id OR 
    auth.uid() IN (SELECT course_id FROM jobs WHERE id = job_id)
  );

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
```

## API Architecture (Next.js App Router)

### API Routes Structure

```
app/api/
├── auth/
│   ├── callback/route.ts          # OAuth callback
│   ├── signout/route.ts           # Sign out
│   └── profile/route.ts           # Profile management
├── jobs/
│   ├── route.ts                   # GET /api/jobs, POST /api/jobs
│   ├── [id]/route.ts              # GET /api/jobs/:id, PUT /api/jobs/:id
│   ├── [id]/applications/route.ts # Job applications
│   └── search/route.ts            # Job search with filters
├── applications/
│   ├── route.ts                   # GET /api/applications, POST /api/applications
│   └── [id]/route.ts              # Application management
├── messages/
│   ├── route.ts                   # GET /api/messages, POST /api/messages
│   └── [jobId]/route.ts           # Job-specific messages
├── reviews/
│   ├── route.ts                   # GET /api/reviews, POST /api/reviews
│   └── [id]/route.ts              # Individual review management
├── payments/
│   ├── create-intent/route.ts     # Create Stripe payment intent
│   ├── confirm/route.ts           # Confirm payment
│   └── webhooks/route.ts          # Stripe webhooks
├── certifications/
│   ├── route.ts                   # Certification CRUD
│   ├── verify/route.ts            # Admin verification
│   └── upload/route.ts            # Document upload
└── admin/
    ├── users/route.ts             # User management
    ├── jobs/route.ts              # Job moderation
    └── analytics/route.ts         # Platform analytics
```

## User Experience Flows

### Golf Course Journey
1. **Registration**: Sign up → Business verification → Payment setup → Profile completion
2. **Job Posting**: Create job → Set requirements → Publish → Receive applications
3. **Hiring**: Review applications → Message candidates → Select professional → Confirm details
4. **Job Management**: Track progress → Communicate → Approve completion → Rate professional

### Professional Journey  
1. **Registration**: Sign up → Profile setup → Certification upload → Verification
2. **Job Discovery**: Browse jobs → Filter by criteria → View details → Apply
3. **Communication**: Message golf courses → Negotiate terms → Confirm acceptance
4. **Job Execution**: Complete work → Document progress → Submit completion → Receive payment

## Success Metrics

### User Acquisition
- Monthly active users (MAU) growth rate: 20% month-over-month
- User registration conversion rate: 15% of visitors
- Geographic market penetration: 3 major markets in first 6 months

### Engagement Metrics
- Average jobs posted per golf course per month: 8
- Application-to-hire ratio: 25% (1 in 4 applications result in hire)
- Message response rate: 80% within 24 hours
- Repeat usage: 60% of users return within 30 days

### Business Metrics
- Gross Merchandise Value (GMV): $100K in first 6 months
- Platform take rate: 12% of transaction value
- Average transaction value: $350 per job
- Customer Lifetime Value: $2,000 per golf course

### Quality Metrics
- Average professional rating: 4.3+ stars
- Job completion rate: 95%
- Dispute rate: <2% of transactions
- Platform safety incidents: 0

## Technical Requirements

### Performance Requirements
- Page load time: <2 seconds (mobile), <1.5 seconds (desktop)
- API response time: <300ms for 95th percentile
- Database query performance: <100ms average
- Real-time message delivery: <500ms
- Mobile app performance: 60fps, <3 second cold start

### Security & Compliance
- End-to-end encryption for sensitive data
- GDPR compliance with data export/deletion
- PCI DSS compliance for payment processing
- Background check integration for professionals
- Insurance verification for all workers

### Scalability Targets
- Support 10,000 concurrent users
- Handle 1M+ job postings per year
- Process $10M+ in annual transaction volume
- Maintain 99.9% uptime availability
- Auto-scale based on demand patterns

## Deployment & Infrastructure

### Hosting Architecture
- **Frontend**: Vercel with global CDN
- **Database**: Supabase (managed PostgreSQL)
- **File Storage**: Supabase Storage with CDN
- **Payments**: Stripe Connect for marketplace
- **Real-time**: Supabase Realtime subscriptions
- **Analytics**: Vercel Analytics + PostHog

### Domain & SSL
- Custom domain migration from AWS to Vercel
- Automatic SSL certificate management
- Global CDN for optimal performance
- SEO optimization with Next.js SSR

### Monitoring & Observability
- Error tracking: Sentry
- Performance monitoring: Vercel Analytics
- User analytics: PostHog
- Uptime monitoring: UptimeRobot
- Database monitoring: Supabase dashboard

## Risk Mitigation

### Technical Risks
- **Database performance**: Implement query optimization and caching
- **Payment processing**: Use Stripe's robust infrastructure with fallbacks
- **Real-time messaging**: Leverage Supabase's battle-tested real-time system
- **File uploads**: Implement client-side validation and server-side scanning

### Business Risks
- **Market adoption**: Start with focused geographic markets
- **Quality control**: Implement comprehensive verification and rating systems
- **Regulatory compliance**: Regular legal review and compliance auditing
- **Competition**: Focus on golf-specific features and network effects

### Operational Risks
- **Customer support**: Implement in-app support and knowledge base
- **Fraud prevention**: Use Stripe Radar and custom fraud detection
- **Data backup**: Automated daily backups with point-in-time recovery
- **Incident response**: Automated alerting and escalation procedures

This PRD provides the foundation for building a robust, scalable golf course maintenance marketplace using modern web technologies with a focus on rapid development and cost-effective scaling.