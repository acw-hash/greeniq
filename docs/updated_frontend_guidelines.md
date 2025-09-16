# GreenIQ Frontend Engineering Guidelines - Next.js 14

## Table of Contents
1. [Project Structure & File Organization](#project-structure--file-organization)
2. [Next.js App Router Patterns](#nextjs-app-router-patterns)
3. [Component Design & Architecture](#component-design--architecture)
4. [State Management](#state-management)
5. [Styling Guidelines](#styling-guidelines)
6. [Supabase Integration](#supabase-integration)
7. [Performance Guidelines](#performance-guidelines)
8. [TypeScript Best Practices](#typescript-best-practices)
9. [Testing Practices](#testing-practices)

---

## Project Structure & File Organization

### Next.js 14 App Router Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route groups for auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   ├── golf-course/
│   │   │   │   └── page.tsx
│   │   │   ├── professional/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected dashboard routes
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
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── jobs/
│   │   ├── applications/
│   │   ├── messages/
│   │   ├── payments/
│   │   └── admin/
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── loading.tsx               # Global loading UI
│   ├── error.tsx                 # Global error boundary
│   └── not-found.tsx             # 404 page
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components (shadcn/ui)
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
│   └── layout/
│       ├── Header.tsx
│       ├── Navigation.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/                          # Utilities and configurations
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase
│   │   ├── server.ts             # Server-side Supabase
│   │   └── types.ts              # Database types
│   ├── stripe/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── utils/
│   │   ├── cn.ts                 # Class name utility
│   │   ├── format.ts             # Formatting utilities
│   │   └── validation.ts         # Validation helpers
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useJobs.ts
│   │   ├── useMessages.ts
│   │   └── useLocalStorage.ts
│   ├── stores/
│   │   ├── authStore.ts          # Zustand stores
│   │   ├── jobStore.ts
│   │   └── uiStore.ts
│   └── validations/
│       ├── auth.ts               # Zod schemas
│       ├── jobs.ts
│       └── profile.ts
├── types/                        # TypeScript definitions
│   ├── database.ts               # Supabase generated types
│   ├── auth.ts
│   ├── jobs.ts
│   └── global.ts
└── middleware.ts                 # Next.js middleware
```

---

## Next.js App Router Patterns

### Route Layouts and Templates

```typescript
// app/layout.tsx - Root layout
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GreenIQ - Golf Course Maintenance Marketplace',
  description: 'Connect golf courses with qualified maintenance professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}

// app/(dashboard)/layout.tsx - Dashboard layout
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Navigation />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

### Server and Client Components

```typescript
// app/(dashboard)/jobs/page.tsx - Server Component
import { createClient } from '@/lib/supabase/server'
import { JobList } from '@/components/jobs/JobList'
import { JobSearch } from '@/components/jobs/JobSearch'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()
  
  // Server-side data fetching
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      golf_course_profiles(course_name, location),
      applications(count)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Available Jobs</h1>
      <JobSearch />
      <JobList initialJobs={jobs || []} />
    </div>
  )
}

// components/jobs/JobList.tsx - Client Component
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JobCard } from './JobCard'

interface JobListProps {
  initialJobs: Job[]
}

export function JobList({ initialJobs }: JobListProps) {
  const [jobs, setJobs] = useState(initialJobs)
  const supabase = createClient()
  
  useEffect(() => {
    // Real-time subscription for new jobs
    const channel = supabase
      .channel('job-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.open'
        },
        (payload) => {
          setJobs(prev => [payload.new as Job, ...prev])
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
```

### Dynamic Routes and Metadata

```typescript
// app/(dashboard)/jobs/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { JobDetail } from '@/components/jobs/JobDetail'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: job } = await supabase
    .from('jobs')
    .select('title, description')
    .eq('id', params.id)
    .single()
  
  if (!job) return {}
  
  return {
    title: `${job.title} - GreenIQ`,
    description: job.description.slice(0, 160),
  }
}

export default async function JobPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      golf_course_profiles(*),
      applications(*)
    `)
    .eq('id', params.id)
    .single()
  
  if (!job) {
    notFound()
  }
  
  return <JobDetail job={job} />
}
```

---

## Component Design & Architecture

### Atomic Design with shadcn/ui

```typescript
// components/ui/button.tsx - Atom
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

// components/jobs/JobCard.tsx - Molecule
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, DollarSign } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface JobCardProps {
  job: Job
  onApply?: (jobId: string) => void
  showApplyButton?: boolean
}

export function JobCard({ job, onApply, showApplyButton = true }: JobCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg line-clamp-2">{job.title}</h3>
          <Badge variant={job.urgency_level === 'high' ? 'destructive' : 'default'}>
            {job.urgency_level}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{job.golf_course_profiles?.course_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>${job.hourly_rate}/hr</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {job.required_certifications?.map((cert) => (
            <Badge key={cert} variant="outline" className="text-xs">
              {cert}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(job.created_at))} ago</span>
        </div>
        
        {showApplyButton && (
          <Button 
            size="sm" 
            onClick={() => onApply?.(job.id)}
          >
            Apply Now
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

---

## State Management

### Zustand for Global State

```typescript
// lib/stores/authStore.ts
import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),
  
  setProfile: (profile) => set({ profile }),
  
  setLoading: (isLoading) => set({ isLoading }),

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ 
      user: null, 
      profile: null, 
      isAuthenticated: false,
      isLoading: false 
    })
  },

  refreshSession: async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      set({ user: session.user, isAuthenticated: true })
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profile) {
        set({ profile })
      }
    }
    
    set({ isLoading: false })
  },
}))

// lib/stores/jobStore.ts
import { create } from 'zustand'

interface JobFilters {
  location?: string
  jobType?: string
  maxDistance?: number
  minRate?: number
  maxRate?: number
  certifications?: string[]
}

interface JobState {
  jobs: Job[]
  filters: JobFilters
  isLoading: boolean
  searchTerm: string
  viewMode: 'list' | 'map'
}

interface JobActions {
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  updateJob: (id: string, updates: Partial<Job>) => void
  removeJob: (id: string) => void
  setFilters: (filters: Partial<JobFilters>) => void
  setSearchTerm: (term: string) => void
  setViewMode: (mode: 'list' | 'map') => void
  setLoading: (loading: boolean) => void
}

type JobStore = JobState & JobActions

export const useJobStore = create<JobStore>((set) => ({
  // State
  jobs: [],
  filters: {},
  isLoading: false,
  searchTerm: '',
  viewMode: 'list',

  // Actions
  setJobs: (jobs) => set({ jobs }),
  
  addJob: (job) => set((state) => ({ 
    jobs: [job, ...state.jobs] 
  })),
  
  updateJob: (id, updates) => set((state) => ({
    jobs: state.jobs.map(job => 
      job.id === id ? { ...job, ...updates } : job
    )
  })),
  
  removeJob: (id) => set((state) => ({
    jobs: state.jobs.filter(job => job.id !== id)
  })),
  
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  
  setViewMode: (viewMode) => set({ viewMode }),
  
  setLoading: (isLoading) => set({ isLoading }),
}))
```

### TanStack Query for Server State

```typescript
// lib/hooks/useJobs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useJobStore } from '@/lib/stores/jobStore'

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('jobs')
        .select(`
          *,
          golf_course_profiles(course_name, location),
          applications(count)
        `)
        .eq('status', 'open')
      
      // Apply filters
      if (filters?.jobType) {
        query = query.eq('job_type', filters.jobType)
      }
      
      if (filters?.minRate) {
        query = query.gte('hourly_rate', filters.minRate)
      }
      
      if (filters?.maxRate) {
        query = query.lte('hourly_rate', filters.maxRate)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useJobApplication() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (application: CreateApplicationData) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('applications')
        .insert(application)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch jobs and applications
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

// lib/hooks/useAuth.ts
export function useAuth() {
  const { user, profile, isLoading, isAuthenticated } = useAuthStore()
  
  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
  }
}
```

---

## Supabase Integration

### Client and Server Setup

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export const createClient = () => createClientComponentClient<Database>()

// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export const createClient = () => createServerComponentClient<Database>({ cookies })

// lib/supabase/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createMiddlewareClient({ req: request, res: response })
  await supabase.auth.getSession()

  return response
}
```

### Real-time Subscriptions

```typescript
// lib/hooks/useRealtimeMessages.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/messages'

export function useRealtimeMessages(jobId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }

    fetchMessages()

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

  const sendMessage = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('messages')
      .insert({
        job_id: jobId,
        sender_id: user.id,
        content,
        message_type: 'text'
      })

    if (error) throw error
  }

  return { messages, sendMessage }
}
```

### File Upload Components

```typescript
// components/ui/FileUpload.tsx
'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface FileUploadProps {
  bucket: string
  path?: string
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  onUpload?: (urls: string[]) => void
}

export function FileUpload({
  bucket,
  path = '',
  accept = { 'image/*': [], 'application/pdf': [] },
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  onUpload
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const supabase = createClient()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const fileName = `${path}${Date.now()}-${file.name}`
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path)

        return publicUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setUploadedFiles(prev => [...prev, ...uploadedUrls])
      onUpload?.(uploadedUrls)
      setUploadProgress(100)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }, [bucket, path, onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled: uploading
  })

  const removeFile = (url: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== url))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
        </p>
      </div>

      {uploading && (
        <Progress value={uploadProgress} className="w-full" />
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((url, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span className="text-sm truncate">{url.split('/').pop()}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(url)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Styling Guidelines

### Tailwind CSS with CSS Variables

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 142 86% 28%;
    --primary-foreground: 355.7 100% 97.3%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 72.22% 50.59%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 142 86% 28%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 142 86% 28%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 142 86% 28%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .container {
    @apply max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8;
  }
  
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors;
  }
  
  .card-hover {
    @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-1;
  }
  
  .form-input {
    @apply flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  
  .line-clamp-3 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
}
```

### Component-Specific Styling

```typescript
// components/jobs/JobCard.tsx with enhanced styling
export function JobCard({ job, onApply }: JobCardProps) {
  return (
    <Card className="group relative overflow-hidden card-hover">
      {/* Urgency indicator */}
      {job.urgency_level === 'high' && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] border-t-red-500">
          <span className="absolute -top-6 -right-1 text-white text-xs font-bold transform rotate-45">
            URGENT
          </span>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {job.title}
          </h3>
          <Badge 
            variant={job.urgency_level === 'high' ? 'destructive' : 'secondary'}
            className="shrink-0"
          >
            {job.urgency_level}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{job.golf_course_profiles?.course_name}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-green-600">
            <DollarSign className="h-4 w-4" />
            <span>${job.hourly_rate}/hr</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {job.description}
        </p>
        
        {job.required_certifications && job.required_certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.required_certifications.slice(0, 3).map((cert) => (
              <Badge key={cert} variant="outline" className="text-xs">
                {cert.replace('_', ' ')}
              </Badge>
            ))}
            {job.required_certifications.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{job.required_certifications.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(job.created_at))} ago</span>
        </div>
        
        <Button 
          size="sm" 
          onClick={() => onApply?.(job.id)}
          className="font-medium"
        >
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## Performance Guidelines

### Next.js Optimization

```typescript
// Image optimization
import Image from 'next/image'

export function ProfileAvatar({ src, alt, size = 40 }: ProfileAvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full object-cover"
      priority={size > 80} // Priority for larger avatars
    />
  )
}

// Font optimization
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono'
})

// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const JobMap = dynamic(() => import('@/components/jobs/JobMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />
})

// Streaming with Suspense
import { Suspense } from 'react'

export default function JobsPage() {
  return (
    <div>
      <h1>Jobs</h1>
      <Suspense fallback={<JobsSkeleton />}>
        <JobsList />
      </Suspense>
    </div>
  )
}
```

### Client-Side Performance

```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

export function VirtualJobList({ jobs }: { jobs: Job[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <JobCard job={jobs[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={jobs.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  )
}

// Debounced search
import { useDebouncedCallback } from 'use-debounce'

export function JobSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      // Perform search
      searchJobs(value)
    },
    300
  )

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value)
        debouncedSearch(e.target.value)
      }}
      placeholder="Search jobs..."
    />
  )
}
```

---

## Testing Practices

### Component Testing

```typescript
// __tests__/components/JobCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { JobCard } from '@/components/jobs/JobCard'
import { mockJob } from '@/lib/test-utils/mocks'

describe('JobCard', () => {
  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />)
    
    expect(screen.getByText(mockJob.title)).toBeInTheDocument()
    expect(screen.getByText(`${mockJob.hourly_rate}/hr`)).toBeInTheDocument()
    expect(screen.getByText(mockJob.golf_course_profiles.course_name)).toBeInTheDocument()
  })

  it('calls onApply when apply button is clicked', () => {
    const mockOnApply = jest.fn()
    render(<JobCard job={mockJob} onApply={mockOnApply} />)
    
    fireEvent.click(screen.getByText('Apply Now'))
    expect(mockOnApply).toHaveBeenCalledWith(mockJob.id)
  })

  it('shows urgency indicator for high priority jobs', () => {
    const urgentJob = { ...mockJob, urgency_level: 'high' }
    render(<JobCard job={urgentJob} />)
    
    expect(screen.getByText('URGENT')).toBeInTheDocument()
  })
})
```

### Integration Testing

```typescript
// __tests__/pages/jobs.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JobsPage from '@/app/(dashboard)/jobs/page'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('Jobs Page', () => {
  it('displays jobs correctly', async () => {
    renderWithProviders(<JobsPage searchParams={{}} />)
    
    await waitFor(() => {
      expect(screen.getByText('Available Jobs')).toBeInTheDocument()
    })
  })
})
```

This comprehensive frontend guide provides the foundation for building a modern, performant React application with Next.js 14, Supabase integration, and best practices for component architecture, state management, and testing.