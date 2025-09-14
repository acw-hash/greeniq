"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Search, 
  MessageSquare, 
  FileText,
  CreditCard,
  User
} from 'lucide-react'

interface QuickActionsProps {
  userType?: string
}

export function QuickActions({ userType }: QuickActionsProps) {
  if (userType === 'golf_course') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Plus className="h-4 w-4 mr-2 text-primary" />
              Post New Job
            </CardTitle>
            <CardDescription className="text-sm">
              Create a new maintenance job posting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/jobs/create">
              <Button className="w-full" size="sm">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              Review Applications
            </CardTitle>
            <CardDescription className="text-sm">
              Check new applications for your jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/applications">
              <Button variant="outline" className="w-full" size="sm">
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-primary" />
              Messages
            </CardTitle>
            <CardDescription className="text-sm">
              Communicate with professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/messages">
              <Button variant="outline" className="w-full" size="sm">
                Open Chat
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-primary" />
              Payments
            </CardTitle>
            <CardDescription className="text-sm">
              Manage payments and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/payments">
              <Button variant="outline" className="w-full" size="sm">
                View History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userType === 'professional') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Search className="h-4 w-4 mr-2 text-primary" />
              Find Jobs
            </CardTitle>
            <CardDescription className="text-sm">
              Browse available maintenance jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/jobs">
              <Button className="w-full" size="sm">
                Search Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              My Applications
            </CardTitle>
            <CardDescription className="text-sm">
              Track your job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/applications">
              <Button variant="outline" className="w-full" size="sm">
                View Status
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <User className="h-4 w-4 mr-2 text-primary" />
              Update Profile
            </CardTitle>
            <CardDescription className="text-sm">
              Keep your profile up to date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile">
              <Button variant="outline" className="w-full" size="sm">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-primary" />
              Earnings
            </CardTitle>
            <CardDescription className="text-sm">
              View your earnings and payouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/payments">
              <Button variant="outline" className="w-full" size="sm">
                View Earnings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
