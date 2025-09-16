# GreenIQ Application Flow Document - Next.js Implementation

## Overview

This document outlines the complete application flow for GreenIQ using Next.js 14 with App Router, Supabase for database and authentication, and Vercel deployment. All flows are optimized for the modern web architecture with server-side rendering, real-time updates, and seamless user experience.

## Technology Context

- **Framework**: Next.js 14 (App Router) for full-stack development
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with JWT and OAuth providers
- **Deployment**: Vercel with custom domain configuration
- **Real-time**: Supabase Realtime for live updates
- **Payments**: Stripe Connect for marketplace transactions

## User Journey Architecture

### Primary User Types
- **Golf Course Operators** (Employers)
- **Maintenance Professionals** (Service Providers)

### Application Structure
```
app/
├── (auth)/              # Authentication routes
├── (dashboard)/         # Protected dashboard routes
├── (public)/           # Public pages
├── api/                # API routes
└── globals.css         # Global styles
```

---

## 1. Onboarding Flows

### 1.1 Initial App Launch Flow

**Entry Point**: Landing page `/`

```
START → Landing Screen (/app/page.tsx)
├── User Type Selection
│   ├── "I'm a Golf Course" → Golf Course Registration (/register/golf-course)
│   ├── "I'm a Professional" → Professional Registration (/register/professional)
│   └── "Browse Jobs" → Public Job Browse (/jobs)
├── Existing User → Login Flow (/login)
└── Demo Mode → Limited Guest Access
```

**Implementation Details**:
- Server-side rendering for SEO optimization
- Geolocation detection for location-based job suggestions
- Progressive enhancement for offline capability
- Supabase Auth session detection for auto-login

**Conditional Logic**:
- If Supabase session exists → Auto-redirect to dashboard
- If location permission denied → Show location importance modal
- If network unavailable → Offline mode with service worker

### 1.2 Golf Course Registration Flow

**Entry Point**: `/register/golf-course`

```
START → Course Registration Form
├── Business Information Collection
│   ├── Course Name (Required, validation via API)
│   ├── Course Type (Select: Public/Private/Resort/Municipal)
│   ├── Business Address (Google Places API integration)
│   ├── Contact Information (Phone validation)
│   └── Website (Optional, URL validation)
├── Account Setup
│   ├── Email Address (Supabase Auth integration)
│   ├── Password Creation (Strength validation)
│   ├── Confirm Password (Match validation)
│   └── Terms of Service Agreement (Required checkbox)
├── Verification Process
│   ├── Email Verification (Supabase Auth flow)
│   ├── Phone Verification (Twilio SMS integration)
│   └── Business License Upload (Supabase Storage)
├── Payment Setup
│   ├── Stripe Connect Onboarding
│   ├── Banking Information
│   └── Tax Documentation
└── Profile Completion
    ├── Course Photos (Multi-upload with compression)
    ├── Facility Details (Rich text editor)
    ├── Staffing Preferences (Multi-select)
    └── Professional Qualifications (Certification filters)
```

**Implementation Components**:
```typescript
// app/(auth)/register/golf-course/page.tsx
export default function GolfCourseRegistration() {
  // Multi-step form with Zustand state management
  // Real-time validation with Zod schemas
  // Supabase Auth integration
  // Stripe Connect onboarding
}

// API Routes
// app/api/auth/register/golf-course/route.ts
// app/api/verification/business/route.ts
// app/api/stripe/connect/route.ts
```

**Conditional Paths**:
- **Email Already Exists** → Redirect to login with reset option
- **Invalid Business Info** → Verification assistance or manual review
- **Payment Setup Issues** → Alternative payment methods or delayed setup
- **Incomplete Verification** → Limited account access with completion prompts

**Error Handling**:
- Network timeout → Auto-save form data with recovery
- Invalid email format → Real-time validation with suggestions
- Weak password → Strength meter with requirements
- File upload failure → Retry mechanism with format guidance

### 1.3 Professional Registration Flow

**Entry Point**: `/register/professional`

```
START → Professional Registration Form
├── Personal Information
│   ├── Full Name (Required, validation)
│   ├── Email Address (Supabase Auth)
│   ├── Phone Number (SMS verification)
│   ├── Home Address (Location services)
│   └── Date of Birth (Age verification)
├── Work Authorization
│   ├── Eligibility Confirmation (Legal checkbox)
│   ├── Driver's License Upload (Document verification)
│   └── SSN (Encrypted storage for background checks)
├── Professional Information
│   ├── Experience Level (Beginner/Intermediate/Expert)
│   ├── Specialization Areas (Multi-select with descriptions)
│   ├── Certification Uploads (Document management)
│   ├── Equipment Skills (Skill matrix)
│   └── Service Radius (Map-based selection)
├── Account Security
│   ├── Password Setup (Security requirements)
│   ├── Two-Factor Authentication (Optional)
│   └── Security Questions (Account recovery)
├── Background Verification
│   ├── Background Check Consent (Legal requirement)
│   ├── Reference Contacts (Verification system)
│   └── Employment History (Work validation)
└── Profile Setup
    ├── Professional Photo (Avatar upload)
    ├── Bio/Description (Rich text with character limit)
    ├── Portfolio Gallery (Multi-image upload)
    └── Rate and Availability (Calendar integration)
```

**Implementation Components**:
```typescript
// app/(auth)/register/professional/page.tsx
export default function ProfessionalRegistration() {
  // Step-by-step wizard with progress indicator
  // Document upload with drag-and-drop
  // Real-time availability calendar
  // Background check integration
}

// API Routes
// app/api/auth/register/professional/route.ts
// app/api/background-checks/initiate/route.ts
// app/api/certifications/upload/route.ts
```

**Conditional Paths**:
- **Background Check Required** → Third-party service integration (Checkr)
- **Certification Expired** → Renewal workflow with grace period
- **Incomplete Experience** → Entry-level track with training resources
- **International Worker** → Additional documentation requirements

---

## 2. Core Workflow Flows

### 2.1 Job Posting Flow (Golf Course)

**Entry Point**: `/dashboard/jobs/create`

```
START → Job Creation Wizard
├── Job Type Selection
│   ├── Greenskeeping (Detailed sub-categories)
│   ├── Equipment Operation (Machinery specifications)
│   ├── Irrigation Maintenance (System types)
│   ├── Landscaping (Design/maintenance)
│   └── General Maintenance (Broad category)
├── Job Details Configuration
│   ├── Title and Description (Rich text editor)
│   ├── Location Settings (GPS + address)
│   ├── Schedule Requirements (Date/time picker)
│   ├── Duration Estimation (Hours/days)
│   ├── Compensation Rate (Market rate suggestions)
│   └── Special Instructions (Additional requirements)
├── Requirements Specification
│   ├── Required Certifications (Multi-select with verification)
│   ├── Experience Level (Minimum requirements)
│   ├── Equipment Needed (Provided/required)
│   ├── Physical Requirements (Accessibility considerations)
│   └── Background Check Level (Security requirements)
├── Urgency and Scheduling
│   ├── Start Date Preference (Calendar picker)
│   ├── Urgency Level (Normal/High/Emergency)
│   ├── Flexibility Options (Schedule negotiation)
│   └── Recurring Job Setup (Template creation)
└── Preview and Publish
    ├── Job Details Review (Comprehensive preview)
    ├── Payment Authorization (Stripe pre-auth)
    ├── Professional Matching (Algorithm preview)
    └── Publication Confirmation (Go-live)
```

**Implementation Components**:
```typescript
// app/(dashboard)/jobs/create/page.tsx
export default function CreateJob() {
  // Form state management with React Hook Form
  // Real-time job preview
  // Professional matching preview
  // Payment integration
}

// API Routes
// app/api/jobs/route.ts (POST)
// app/api/jobs/match/route.ts
// app/api/payments/pre-auth/route.ts
```

**Conditional Logic**:
- **Urgent Job** (< 24 hours) → Premium placement + enhanced notifications
- **Recurring Job** → Template save option + scheduling automation
- **High-Risk Job** → Additional insurance requirements
- **Peak Season** → Dynamic pricing suggestions based on demand

### 2.2 Job Discovery and Application Flow (Professional)

**Entry Point**: `/dashboard/jobs`

```
START → Job Discovery Dashboard
├── Job Search Interface
│   ├── Location-Based Search (Map integration)
│   ├── Advanced Filters
│   │   ├── Job Type (Category filtering)
│   │   ├── Pay Range (Slider input)
│   │   ├── Distance (Radius selection)
│   │   ├── Start Date (Calendar range)
│   │   ├── Duration (Hours/days filter)
│   │   └── Requirements Match (Skill alignment)
│   ├── Map View Toggle (List/Map toggle)
│   ├── Saved Searches (Persistent filters)
│   └── Real-time Updates (Supabase subscriptions)
├── Job Detail View (/jobs/[id])
│   ├── Complete Job Information (Rich display)
│   ├── Golf Course Profile (Embedded profile)
│   ├── Requirements Matching (Compatibility score)
│   ├── Location and Directions (Map integration)
│   ├── Compensation Details (Clear breakdown)
│   └── Similar Jobs (Recommendation engine)
├── Application Process
│   ├── Quick Apply (Pre-filled from profile)
│   ├── Custom Message (Personalized introduction)
│   ├── Rate Negotiation (If allowed by job posting)
│   ├── Availability Confirmation (Calendar check)
│   ├── Portfolio Selection (Relevant work samples)
│   └── Application Submission (With confirmation)
└── Application Tracking (/dashboard/applications)
    ├── Application Status (Real-time updates)
    ├── Golf Course Communication (Integrated messaging)
    ├── Interview Scheduling (Calendar integration)
    ├── Job Acceptance/Decline (Status management)
    └── Performance Analytics (Application success rate)
```

**Implementation Components**:
```typescript
// app/(dashboard)/jobs/page.tsx
export default function JobDiscovery() {
  // Real-time job feed with Supabase subscriptions
  // Advanced filtering with URL state management
  // Interactive map with clustering
  // Infinite scroll pagination
}

// app/(dashboard)/jobs/[id]/page.tsx
export default function JobDetail({ params }: { params: { id: string } }) {
  // Server-side rendering for SEO
  // Real-time application updates
  // Integrated messaging system
}
```

**Conditional Paths**:
- **Missing Qualifications** → Skill gap notification + training suggestions
- **Schedule Conflict** → Alternative availability or auto-decline
- **Rate Below Minimum** → Negotiation interface or decline recommendation
- **High Competition** → Application enhancement suggestions

---

## 3. Communication & Real-time Features

### 3.1 Real-time Messaging System

**Entry Point**: `/dashboard/messages` or job-specific chat

```
START → Message Interface
├── Conversation Management
│   ├── Job-Specific Threads (Organized by job)
│   ├── Direct Messages (User-to-user communication)
│   ├── Group Conversations (Multi-participant jobs)
│   └── System Notifications (Automated updates)
├── Message Composition
│   ├── Rich Text Editor (Formatting options)
│   ├── File Attachments (Document sharing)
│   ├── Photo Sharing (Work documentation)
│   ├── Voice Messages (Quick communication)
│   ├── Quick Replies (Template responses)
│   └── Location Sharing (Meeting coordination)
├── Real-time Features
│   ├── Live Typing Indicators (Supabase Realtime)
│   ├── Message Delivery Status (Sent/Delivered/Read)
│   ├── Online Status (Presence system)
│   ├── Push Notifications (Browser + mobile)
│   └── Offline Message Queue (Service worker)
└── Message Management
    ├── Search and Filter (Message history)
    ├── Archive Conversations (Organization)
    ├── Starred Messages (Important items)
    ├── Export Chat History (Data portability)
    └── Report/Block Users (Safety features)
```

**Implementation Components**:
```typescript
// app/(dashboard)/messages/page.tsx
export default function Messages() {
  // Supabase Realtime subscriptions
  // Message pagination and virtualization
  // File upload with progress indicators
  // Push notification integration
}

// lib/realtime/messages.ts
export function useRealtimeMessages(jobId: string) {
  // Real-time message subscription
  // Optimistic updates
  // Typing indicators
}
```

### 3.2 Notification System

**Implementation**: Comprehensive notification system

```
START → Notification Trigger
├── Notification Types
│   ├── Job Alerts (New matching jobs)
│   ├── Application Updates (Status changes)
│   ├── Messages (New conversations)
│   ├── Schedule Reminders (Upcoming jobs)
│   ├── Payment Notifications (Transaction updates)
│   ├── System Announcements (Platform updates)
│   └── Safety Alerts (Important notices)
├── Delivery Channels
│   ├── In-App Notifications (Real-time updates)
│   ├── Browser Push (Web push API)
│   ├── Email Notifications (Transactional emails)
│   ├── SMS Alerts (Critical notifications)
│   └── Mobile Push (Future mobile app)
├── Personalization Engine
│   ├── User Preference Matching (Custom settings)
│   ├── Timing Optimization (User behavior analysis)
│   ├── Frequency Management (Anti-spam measures)
│   ├── Content Customization (Relevant information)
│   └── Channel Preference (User-selected channels)
└── Analytics and Optimization
    ├── Delivery Tracking (Success rates)
    ├── Engagement Metrics (Click/open rates)
    ├── User Feedback (Notification ratings)
    └── A/B Testing (Content optimization)
```

---

## 4. Payment & Transaction Flows

### 4.1 Stripe Connect Payment Flow

**Entry Point**: Job completion or milestone trigger

```
START → Payment Processing
├── Job Completion Verification
│   ├── Work Completion Confirmation (Both parties)
│   ├── Quality Verification (Photo documentation)
│   ├── Time Tracking Validation (Automated/manual)
│   └── Dispute Resolution (If needed)
├── Payment Calculation
│   ├── Base Rate Calculation (Hours × rate)
│   ├── Overtime Calculations (Premium rates)
│   ├── Bonus Additions (Performance incentives)
│   ├── Platform Fee Deduction (Transparent calculation)
│   └── Tax Calculations (Location-based)
├── Stripe Connect Processing
│   ├── Payment Intent Creation (Secure tokenization)
│   ├── Escrow Management (Hold until completion)
│   ├── Multi-party Splits (Platform + professional)
│   ├── Payout Scheduling (Immediate/scheduled)
│   └── Receipt Generation (Detailed breakdown)
└── Transaction Management
    ├── Payment Confirmation (All parties notified)
    ├── Receipt Distribution (Email + in-app)
    ├── Tax Documentation (1099 preparation)
    ├── Transaction History (Searchable records)
    └── Dispute Resolution (Mediation system)
```

**Implementation Components**:
```typescript
// app/api/payments/create-intent/route.ts
export async function POST(request: Request) {
  // Stripe Payment Intent creation
  // Multi-party payment setup
  // Platform fee calculation
}

// app/api/payments/webhooks/route.ts
export async function POST(request: Request) {
  // Stripe webhook handling
  // Payment confirmation processing
  // Automatic payout management
}
```

---

## 5. Profile & Account Management

### 5.1 Dynamic Profile Management

**Entry Point**: `/dashboard/profile`

```
START → Profile Dashboard
├── Profile Sections
│   ├── Basic Information (Personal/business details)
│   ├── Professional Details (Skills and experience)
│   ├── Certifications (Document management)
│   ├── Portfolio (Work gallery)
│   ├── Reviews and Ratings (Performance history)
│   ├── Availability Calendar (Schedule management)
│   ├── Payment Settings (Stripe Connect)
│   └── Privacy Settings (Data control)
├── Edit Interface
│   ├── Inline Editing (Quick updates)
│   ├── Bulk Update Options (Efficiency tools)
│   ├── Photo Management (Upload/crop/organize)
│   ├── Document Upload (Certification updates)
│   ├── Calendar Integration (Availability sync)
│   └── Real-time Preview (Live updates)
├── Verification Management
│   ├── Certification Status (Renewal tracking)
│   ├── Background Check Status (Security verification)
│   ├── Insurance Documentation (Coverage tracking)
│   ├── Identity Verification (Document validation)
│   └── Professional References (Contact verification)
└── Performance Analytics
    ├── Profile Completion (Optimization suggestions)
    ├── View Statistics (Profile traffic)
    ├── Application Success Rate (Performance metrics)
    ├── Earnings Summary (Financial overview)
    └── Customer Feedback (Review analysis)
```

---

## 6. Error Handling & Recovery

### Global Error Handling Strategy

**Next.js Error Boundaries and Recovery**:

```typescript
// app/error.tsx - Global error boundary
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Sentry error reporting
  // User-friendly error display
  // Recovery suggestions
}

// app/not-found.tsx - 404 handling
export default function NotFound() {
  // Custom 404 page
  // Navigation suggestions
  // Search functionality
}
```

**Error Categories and Responses**:

1. **Network Errors**
   - Connection timeout → Retry with exponential backoff
   - No internet → Offline mode with service worker
   - Server unavailable → Cached data with refresh options

2. **Authentication Errors**
   - Session expired → Automatic refresh attempt
   - Invalid credentials → Clear error messaging
   - Account locked → Recovery process guidance

3. **Validation Errors**
   - Form validation → Real-time feedback
   - File upload → Format guidance and retry
   - Data constraints → Clear correction instructions

4. **Payment Errors**
   - Card declined → Alternative payment methods
   - Processing failure → Retry mechanism
   - Dispute raised → Automatic escalation

---

## 7. Performance Considerations

### Next.js Optimization Features

```typescript
// Server-side rendering for SEO
export async function generateMetadata({ params }): Promise<Metadata> {
  // Dynamic meta tags for job postings
  // Social media optimization
  // Search engine optimization
}

// Static generation for public pages
export async function generateStaticParams() {
  // Pre-build popular job categories
  // Location-based static pages
}

// Image optimization
import Image from 'next/image'
// Automatic optimization and lazy loading
```

### Real-time Performance

```typescript
// Supabase Realtime optimization
export function useOptimizedSubscription(table: string, filters: any) {
  // Efficient subscription management
  // Automatic cleanup on unmount
  // Batched updates for performance
}
```

### Caching Strategy

- **Next.js App Router**: Automatic caching for static content
- **TanStack Query**: Client-side data caching with invalidation
- **Supabase**: Database-level caching for frequently accessed data
- **Vercel Edge**: CDN caching for global performance

This comprehensive flow document provides the blueprint for implementing GreenIQ's user experience using modern Next.js architecture with real-time capabilities, ensuring optimal performance and user satisfaction.