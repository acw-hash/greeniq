"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DollarSign, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  createApplicationSchema,
  type CreateApplicationInput 
} from '@/lib/validations/jobs'

interface ApplicationFormProps {
  jobId: string
  jobTitle: string
  jobRate: number
  onSubmit: (data: CreateApplicationInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function ApplicationForm({
  jobId,
  jobTitle,
  jobRate,
  onSubmit,
  onCancel,
  isLoading = false
}: ApplicationFormProps) {
  const form = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      job_id: jobId,
      message: '',
      proposed_rate: jobRate,
    },
  })

  const handleSubmit = (data: CreateApplicationInput) => {
    onSubmit(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Apply for Job</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium">{jobTitle}</h4>
          <p className="text-sm text-muted-foreground">
            Offered rate: <span className="font-medium text-green-600">${jobRate}/hr</span>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the golf course why you're the right person for this job. Mention your relevant experience, availability, and any questions you have..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A personalized message increases your chances of being selected
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proposed_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Rate (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder={jobRate.toString()}
                        min="10"
                        max="200"
                        step="0.50"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    You can propose a different rate if you feel it's appropriate. 
                    Leave blank to accept the offered rate of ${jobRate}/hr.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
