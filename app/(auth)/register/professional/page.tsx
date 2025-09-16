import { RegisterForm } from '@/components/auth/RegisterForm'
import { RegistrationErrorBoundary } from '@/components/auth/RegistrationErrorBoundary'

export const metadata = {
  title: 'Professional Registration - GreenIQ',
  description: 'Register as a maintenance professional to find golf course jobs',
}

export default function ProfessionalRegisterPage() {
  return (
    <RegistrationErrorBoundary>
      <RegisterForm userType="professional" />
    </RegistrationErrorBoundary>
  )
}
