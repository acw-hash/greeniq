# GreenCrew Backend Architecture Guide - Next.js Full-Stack

This guide provides a comprehensive overview of the GreenCrew backend architecture using Next.js 14 App Router with integrated API routes and Supabase infrastructure.

---

## ⚖️ Architecture Overview

**Full-Stack Next.js Application**

- **Architecture**: Next.js 14 App Router with integrated API routes
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with JWT and OAuth
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage with CDN
- **Payments**: Stripe Connect for marketplace functionality

---

## 🌐 API Structure

### Primary Interface: **Next.js API Routes**

- RESTful API using Next.js App Router route handlers
- TypeScript-first with end-to-end type safety
- Server-side validation with Zod schemas
- Automatic serialization and error handling

### API Route Organization

```
app/api/
├── auth/                    # Authentication endpoints
│   ├── callback/route.ts    # OAuth callback handling
│   ├── signout/route.ts     # User signout
│   └── profile/route.ts     # Profile management
├── jobs/                    # Job management
│   ├── route.ts             # GET /api/jobs, POST /api/jobs
│   ├── [id]/route.ts        # GET/PUT/DELETE /api/jobs/:id
│   ├── [id]/applications/   # Job applications
│   └── search/route.ts      # Advanced job search
├── applications/            # Application management
│   ├── route.ts             # List and create applications
│   ├── [id]/route.ts        # Update application status
│   └── [id]/messages/route.ts # Application messaging
├── messages/                # Real-time messaging
│   ├── route.ts             # Message CRUD operations
│   ├── [jobId]/route.ts     # Job-specific messages
│   └── upload/route.ts      # File attachments
├── payments/                # Stripe integration
│   ├── create-intent/route.ts # Create payment intent
│   ├── confirm/route.ts     # Confirm payment
│   ├── webhooks/route.ts    # Stripe webhooks
│   └── connect/route.ts     # Stripe Connect onboarding
├── reviews/                 # Rating system
│   ├── route.ts             # Create and list reviews
│   └── [id]/route.ts        # Individual review management
├── certifications/          # Document verification
│   ├── route.ts             # Upload certifications
│   ├── verify/route.ts      # Admin verification
│   └── [id]/route.ts        # Certification management
├── notifications/           # Notification system
│   ├── route.ts             # Get user notifications
│   ├── mark-read/route.ts   # Mark as read
│   └── preferences/route.ts # Notification settings
└── admin/                   # Admin functions
    ├── users/route.ts       # User management
    ├── jobs/route.ts        # Job moderation
    ├── analytics/route.ts   # Platform analytics
    └── reports/route.ts     # Content reports
```

### Route Handler Pattern

```typescript
// app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobSchema } from '@/lib/validations/jobs'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  // Extract query parameters
  const location = searchParams.get('location')
  const jobType = searchParams.get('type')
  const maxDistance = searchParams.get('distance')
  
  try {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        golf_course_profiles(course_name, location),
        applications(count)
      `)
      .eq('status', 'open')
    
    // Add location-based filtering
    if (location && maxDistance) {
      query = query.rpc('jobs_within_distance', {
        lat: parseFloat(location.split(',')[0]),
        lng: parseFloat(location.split(',')[1]),
        distance_km: parseInt(maxDistance)
      })
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Validate request body
    const body = await request.json()
    const validatedData = jobSchema.parse(body)
    
    // Create job
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...validatedData,
        course_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Trigger job matching and notifications
    await notifyMatchingProfessionals(data.id)
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
```

---

## 🗄️ Database Architecture (Supabase PostgreSQL)

### Core Tables

```sql
-- Profiles (extends auth.users)
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
```

### Real-time Subscriptions

```typescript
// lib/realtime/jobs.ts
import { createClient } from '@/lib/supabase/client'

export function useJobSubscription(filters?: JobFilters) {
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('job-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `status=eq.open`
        },
        (payload) => {
          // Handle real-time job updates
          handleJobUpdate(payload)
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [filters])
}
```

---

## 🔐 Authentication & Authorization

### Supabase Auth Integration

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()

// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => createServerComponentClient({ cookies })
```

### Middleware for Route Protection

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session?.user?.id)
      .single()
    
    if (!session || profile?.user_type !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }
  
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, users can update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Jobs: Public read, golf courses can create/update own
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
```

---

## 🚀 Service Integration

### Real-Time Features (Supabase Realtime)

```typescript
// lib/realtime/messages.ts
export function useRealtimeMessages(jobId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()
  
  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId])
  
  return messages
}
```

### Payment Processing (Stripe Connect)

```typescript
// app/api/payments/create-intent/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { jobId, amount } = await request.json()
    
    // Get job and participants
    const supabase = createClient()
    const { data: job } = await supabase
      .from('jobs')
      .select(`
        *,
        golf_course_profiles(stripe_account_id),
        applications!inner(
          professional_profiles(stripe_account_id)
        )
      `)
      .eq('id', jobId)
      .single()
    
    // Calculate platform fee (10%)
    const platformFee = Math.round(amount * 0.1)
    
    // Create payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      application_fee_amount: platformFee * 100,
      on_behalf_of: job.applications[0].professional_profiles.stripe_account_id,
      transfer_data: {
        destination: job.applications[0].professional_profiles.stripe_account_id,
      },
      metadata: {
        jobId,
        courseId: job.course_id,
        professionalId: job.applications[0].professional_id
      }
    })
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment setup failed' },
      { status: 500 }
    )
  }
}
```

### Background Jobs and Notifications

```typescript
// lib/jobs/notifications.ts
export async function notifyMatchingProfessionals(jobId: string) {
  const supabase = createClient()
  
  // Get job details
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  // Find matching professionals
  const { data: professionals } = await supabase
    .from('professional_profiles')
    .select('profile_id, specializations, travel_radius')
    .contains('specializations', job.required_certifications)
  
  // Send notifications to matching professionals
  for (const professional of professionals) {
    await sendJobNotification(professional.profile_id, jobId)
  }
}

async function sendJobNotification(userId: string, jobId: string) {
  // Create in-app notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'new_job',
      title: 'New Job Match',
      message: 'A new job matching your skills is available',
      metadata: { jobId }
    })
  
  // Send push notification (if enabled)
  // Send email notification (if enabled)
}
```

---

## 📊 API Response Patterns

### Standard Response Format

```typescript
// lib/api/responses.ts
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { data, message }
}

export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json({ error }, { status })
}
```

### Sample API Payloads

**Job Creation Request**
```json
POST /api/jobs
{
  "title": "Early Morning Greenskeeper",
  "description": "Need experienced greenskeeper for morning maintenance routine",
  "job_type": "greenskeeping",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "start_date": "2024-03-25T06:00:00Z",
  "end_date": "2024-03-25T14:00:00Z",
  "hourly_rate": 25.00,
  "required_certifications": ["pesticide_license", "equipment_certified"],
  "urgency_level": "normal"
}
```

**Job Creation Response**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Early Morning Greenskeeper",
    "status": "open",
    "created_at": "2024-03-20T10:30:00Z",
    "applications_count": 0
  },
  "message": "Job posted successfully"
}
```

**Job Application Request**
```json
POST /api/applications
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "I have 5 years of greenskeeping experience and am available for the specified hours.",
  "proposed_rate": 25.00
}
```

**Real-time Message Payload**
```json
{
  "id": "msg_123",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_id": "user_456",
  "content": "I'll arrive 15 minutes early to prepare equipment",
  "message_type": "text",
  "created_at": "2024-03-20T08:45:00Z"
}
```

---

## 🔍 Database Functions and Triggers

### PostGIS Location Functions

```sql
-- Function to find jobs within distance
CREATE OR REPLACE FUNCTION jobs_within_distance(
  lat FLOAT,
  lng FLOAT,
  distance_km INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  distance_km FLOAT
) AS $
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
    distance_km * 1000
  )
  AND j.status = 'open'
  ORDER BY distance_km;
END;
$ LANGUAGE plpgsql;
```

### Automated Profile Updates

```sql
-- Trigger to update professional rating
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $
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
$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();
```

---

## 📈 Performance Optimization

### Database Indexing

```sql
-- Performance indexes
CREATE INDEX idx_jobs_location ON jobs USING GIST (location);
CREATE INDEX idx_jobs_status_created ON jobs (status, created_at DESC);
CREATE INDEX idx_applications_professional_status ON applications (professional_id, status);
CREATE INDEX idx_messages_job_created ON messages (job_id, created_at DESC);
CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id);
```

### API Route Optimization

```typescript
// lib/cache/jobs.ts
import { unstable_cache } from 'next/cache'

export const getCachedJobs = unstable_cache(
  async (filters: JobFilters) => {
    // Expensive job search operation
    return await searchJobs(filters)
  },
  ['jobs-search'],
  { 
    revalidate: 300, // 5 minutes
    tags: ['jobs'] 
  }
)

// Revalidate cache when jobs are updated
export async function revalidateJobsCache() {
  revalidateTag('jobs')
}
```

---

## 🛡️ Error Handling and Monitoring

### Centralized Error Handling

```typescript
// lib/errors/handler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  
  // Log unexpected errors
  console.error('Unexpected API error:', error)
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### Monitoring Integration

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})

// lib/analytics/posthog.ts
import { PostHog } from 'posthog-node'

export const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
)
```

---

## 🔧 Development Tools

### API Testing Setup

```typescript
// __tests__/api/jobs.test.ts
import { POST } from '@/app/api/jobs/route'
import { createMockRequest } from '@/lib/test-utils'

describe('/api/jobs', () => {
  it('creates a job successfully', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        title: 'Test Job',
        job_type: 'greenskeeping',
        // ... other job data
      }
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.data.title).toBe('Test Job')
  })
})
```

---

## 📋 Summary for New Engineers

GreenCrew backend architecture leverages:

- **Next.js 14 App Router** for full-stack development
- **Supabase** for database, auth, real-time, and storage
- **Stripe Connect** for marketplace payments
- **Vercel** for deployment and performance optimization

### Key Implementation Patterns:

1. **API Routes**: RESTful endpoints with TypeScript validation
2. **Real-time Updates**: Supabase subscriptions for live features
3. **Authentication**: Supabase Auth with RLS for security
4. **File Handling**: Supabase Storage with automatic optimization
5. **Payment Processing**: Stripe Connect for multi-party transactions

### Development Workflow:

1. Set up Supabase project and configure environment variables
2. Implement database schema with RLS policies
3. Build API routes with proper validation and error handling
4. Add real-time subscriptions for dynamic features
5. Integrate Stripe Connect for payment processing
6. Deploy to Vercel with custom domain configuration

This architecture provides a robust foundation for rapid development while maintaining scalability and performance standards.