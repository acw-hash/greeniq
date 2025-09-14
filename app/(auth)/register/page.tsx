import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield } from 'lucide-react'

export const metadata = {
  title: 'Sign Up - GreenCrew',
  description: 'Create your GreenCrew account',
}

export default function RegisterPage() {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Join GreenCrew</h1>
        <p className="text-gray-600">Choose your account type to get started</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Golf Course</CardTitle>
            <CardDescription>
              Post jobs and find qualified maintenance professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Post unlimited job listings</li>
              <li>• Access to verified professionals</li>
              <li>• Real-time communication</li>
              <li>• Secure payment processing</li>
              <li>• Job management dashboard</li>
            </ul>
            <Link href="/register/golf-course">
              <Button className="w-full">
                Register as Golf Course
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Professional</CardTitle>
            <CardDescription>
              Find golf course maintenance work in your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Browse available jobs</li>
              <li>• Set your own rates</li>
              <li>• Showcase your certifications</li>
              <li>• Get paid instantly</li>
              <li>• Build your reputation</li>
            </ul>
            <Link href="/register/professional">
              <Button className="w-full" variant="outline">
                Register as Professional
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
