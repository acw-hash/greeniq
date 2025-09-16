import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages - GreenCrew',
  description: 'Manage your messages and communications',
}

export default function MessagesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Manage your conversations with golf courses and professionals.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Messages Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            The messaging system is currently under development. 
            Check back soon for real-time communication features.
          </p>
        </div>
      </div>
    </div>
  )
}
