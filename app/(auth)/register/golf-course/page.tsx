import { RegisterForm } from '@/components/auth/RegisterForm'
import { RegistrationErrorBoundary } from '@/components/auth/RegistrationErrorBoundary'

export const metadata = {
  title: 'Golf Course Registration - GreenCrew',
  description: 'Register your golf course to start posting maintenance jobs',
}

export default function GolfCourseRegisterPage() {
  return (
    <RegistrationErrorBoundary>
      <RegisterForm userType="golf_course" />
    </RegistrationErrorBoundary>
  )
}
