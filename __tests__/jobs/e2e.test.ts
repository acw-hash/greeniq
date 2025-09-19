import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { chromium, Browser, Page } from 'playwright'

describe('Job Posting E2E Tests', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false })
    page = await browser.newPage()
    
    // Mock authentication
    await page.addInitScript(() => {
      // Mock localStorage with auth token
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }))
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  describe('Golf Course Job Creation Flow', () => {
    it('should complete full job posting workflow', async () => {
      // Navigate to job creation page
      await page.goto('http://localhost:3000/jobs/create')
      
      // Wait for page to load
      await page.waitForSelector('h1:has-text("Post a New Job")')
      
      // Step 1: Basic Information
      await page.fill('input[placeholder*="Greens Mowing"]', 'E2E Test Job')
      await page.selectOption('select', 'greenskeeping')
      await page.fill('textarea[placeholder*="Describe the job"]', 'This is a comprehensive end-to-end test job description that meets all validation requirements.')
      
      // Click Next
      await page.click('button:has-text("Next")')
      
      // Step 2: Job Details
      await page.waitForSelector('text=Job Details')
      await page.fill('input[type="number"]', '30')
      await page.selectOption('select[placeholder*="experience"]', 'intermediate')
      await page.selectOption('select[placeholder*="urgency"]', 'high')
      
      // Click Next
      await page.click('button:has-text("Next")')
      
      // Step 3: Location
      await page.waitForSelector('text=Location')
      await page.fill('input[placeholder*="address"]', '123 E2E Test Street, Test City, TC 12345')
      await page.fill('input[placeholder="40.7128"]', '37.7749')
      await page.fill('input[placeholder="-74.0060"]', '-122.4194')
      
      // Click Next
      await page.click('button:has-text("Next")')
      
      // Step 4: Schedule
      await page.waitForSelector('text=Schedule')
      
      // Set start date (mock date picker interaction)
      await page.click('button:has-text("Pick a date")')
      // In a real test, you'd interact with the calendar component
      
      // Go to preview
      await page.click('button:has-text("Preview & Post")')
      
      // Verify preview
      await page.waitForSelector('text=Job Preview')
      expect(await page.textContent('h3')).toContain('E2E Test Job')
      expect(await page.textContent('text=$30/hour')).toBeTruthy()
      
      // Submit job
      await page.click('button:has-text("Post Job")')
      
      // Should redirect to jobs list or show success message
      await page.waitForSelector('text=Job created successfully', { timeout: 10000 })
    })

    it('should validate form fields and prevent submission', async () => {
      await page.goto('http://localhost:3000/jobs/create')
      
      // Try to submit without filling required fields
      await page.click('button:has-text("Next")')
      
      // Should show validation errors
      await page.waitForSelector('text=Title must be at least 5 characters')
      await page.waitForSelector('text=Description must be at least 20 characters')
      
      // Fill invalid data
      await page.fill('input[placeholder*="Greens Mowing"]', 'Hi') // Too short
      await page.fill('textarea[placeholder*="Describe the job"]', 'Short') // Too short
      
      await page.click('button:has-text("Next")')
      
      // Should still show validation errors
      await page.waitForSelector('text=Title must be at least 5 characters')
    })
  })

  describe('Job Search and Discovery', () => {
    it('should search and filter jobs', async () => {
      await page.goto('http://localhost:3000/jobs')
      
      // Wait for jobs to load
      await page.waitForSelector('text=Find Your Next Job')
      
      // Search for jobs
      await page.fill('input[placeholder*="Search for jobs"]', 'greenskeeping')
      await page.selectOption('select[placeholder*="Job Type"]', 'greenskeeping')
      await page.selectOption('select[placeholder*="Urgency"]', 'high')
      
      // Click search
      await page.click('button:has-text("Search Jobs")')
      
      // Should show filtered results
      await page.waitForSelector('text=Search Results')
      
      // Click on a job
      await page.click('text=View Details')
      
      // Should navigate to job details
      await page.waitForSelector('h1')
    })

    it('should use map view to find jobs', async () => {
      await page.goto('http://localhost:3000/jobs')
      
      // Switch to map view
      await page.click('button:has-text("Map View")')
      
      // Wait for map to load
      await page.waitForSelector('text=Google Maps Integration')
      
      // Should show job markers on map
      await page.waitForSelector('text=1 jobs')
    })
  })

  describe('Job Management', () => {
    it('should edit existing job', async () => {
      // Navigate to a job (assuming one exists)
      await page.goto('http://localhost:3000/jobs')
      
      // Click on first job
      await page.click('text=View Details')
      
      // Click edit button
      await page.click('button:has-text("Edit")')
      
      // Should navigate to edit page
      await page.waitForSelector('h1:has-text("Edit Job")')
      
      // Update job title
      await page.fill('input[placeholder*="Greens Mowing"]', 'Updated E2E Job Title')
      
      // Go through steps to preview
      await page.click('button:has-text("Next")')
      await page.click('button:has-text("Next")')
      await page.click('button:has-text("Next")')
      await page.click('button:has-text("Preview & Post")')
      
      // Submit update
      await page.click('button:has-text("Post Job")')
      
      // Should show success message
      await page.waitForSelector('text=Job updated successfully')
    })

    it('should delete job', async () => {
      await page.goto('http://localhost:3000/jobs')
      
      // Click on first job
      await page.click('text=View Details')
      
      // Click edit button
      await page.click('button:has-text("Edit")')
      
      // Click delete button
      await page.click('button:has-text("Delete")')
      
      // Confirm deletion
      await page.click('button:has-text("OK")')
      
      // Should redirect to jobs list
      await page.waitForSelector('text=Job deleted successfully')
    })
  })

  describe('Professional Job Application Flow', () => {
    it('should apply for a job as a professional', async () => {
      // Mock professional user
      await page.addInitScript(() => {
        localStorage.setItem('user-type', 'professional')
      })
      
      await page.goto('http://localhost:3000/jobs')
      
      // Find and click on a job
      await page.click('text=Apply Now')
      
      // Should show application form or redirect to application page
      await page.waitForSelector('text=Apply for This Job')
      
      // Fill application form
      await page.fill('textarea[placeholder*="message"]', 'I am very interested in this position and have the required experience.')
      await page.fill('input[placeholder*="proposed rate"]', '28')
      
      // Submit application
      await page.click('button:has-text("Submit Application")')
      
      // Should show success message
      await page.waitForSelector('text=Application submitted successfully')
    })
  })

  describe('Real-time Updates', () => {
    it('should receive real-time job updates', async () => {
      await page.goto('http://localhost:3000/jobs')
      
      // Open another tab to simulate another user creating a job
      const newPage = await browser.newPage()
      await newPage.goto('http://localhost:3000/jobs/create')
      
      // Create a job in the new tab
      await newPage.fill('input[placeholder*="Greens Mowing"]', 'Real-time Test Job')
      await newPage.fill('textarea[placeholder*="Describe the job"]', 'This job should appear in real-time on the other tab.')
      await newPage.selectOption('select', 'greenskeeping')
      await newPage.click('button:has-text("Next")')
      await newPage.click('button:has-text("Next")')
      await newPage.click('button:has-text("Next")')
      await newPage.click('button:has-text("Preview & Post")')
      await newPage.click('button:has-text("Post Job")')
      
      // Check if the job appears in the original tab
      await page.waitForSelector('text=Real-time Test Job', { timeout: 10000 })
      
      await newPage.close()
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('http://localhost:3000/jobs')
      
      // Should show mobile-friendly layout
      await page.waitForSelector('h1')
      
      // Test job creation on mobile
      await page.click('button:has-text("Post New Job")')
      
      // Should show mobile-friendly form
      await page.waitForSelector('h1:has-text("Post a New Job")')
      
      // Form should be usable on mobile
      await page.fill('input[placeholder*="Greens Mowing"]', 'Mobile Test Job')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', async () => {
      await page.goto('http://localhost:3000/jobs')
      
      // Tab through the page
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to navigate with keyboard
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    })

    it('should have proper ARIA labels', async () => {
      await page.goto('http://localhost:3000/jobs/create')
      
      // Check for ARIA labels on form elements
      const titleInput = await page.getAttribute('input[placeholder*="Greens Mowing"]', 'aria-label')
      expect(titleInput).toBeTruthy()
      
      const descriptionTextarea = await page.getAttribute('textarea[placeholder*="Describe the job"]', 'aria-label')
      expect(descriptionTextarea).toBeTruthy()
    })
  })

  describe('Performance', () => {
    it('should load jobs page quickly', async () => {
      const startTime = Date.now()
      
      await page.goto('http://localhost:3000/jobs')
      await page.waitForSelector('h1')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    it('should handle large job lists efficiently', async () => {
      await page.goto('http://localhost:3000/jobs')
      
      // Scroll through job list
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      
      // Should not cause performance issues
      const performanceMetrics = await page.evaluate(() => {
        return {
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          timing: performance.timing.loadEventEnd - performance.timing.navigationStart
        }
      })
      
      expect(performanceMetrics.timing).toBeLessThan(5000) // Should load within 5 seconds
    })
  })
})
