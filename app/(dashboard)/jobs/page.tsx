'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Simple jobs page that won't crash
export default function JobsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Available Jobs</h1>
        <Link 
          href="/jobs/create" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Post a Job
        </Link>
      </div>
      
      <JobsList />
    </div>
  )
}

// Loading component
function JobsLoading() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  )
}

// Client-side jobs list component
function JobsList() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/jobs', {
        cache: 'no-store' // Always fetch fresh data
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      
      const jobsData = await response.json()
      setJobs(jobsData)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchJobs()
  }, [])
  
  if (loading) {
    return <JobsLoading />
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading jobs: {error}</p>
        <button 
          onClick={fetchJobs} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }
  
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No jobs available at the moment</p>
        <p className="text-sm text-gray-500">Check back later for new opportunities</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {jobs.map((job: any) => (
        <div key={job.id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
          <p className="text-gray-600 mb-4">{job.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-green-600 font-medium">${job.hourly_rate}/hour</span>
            <span className="text-sm text-gray-500">{job.job_type}</span>
          </div>
        </div>
      ))}
    </div>
  )
}