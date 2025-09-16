import { AuthPageLogo } from '@/components/ui/Logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <AuthPageLogo />
        </div>
        {children}
      </div>
    </div>
  )
}
