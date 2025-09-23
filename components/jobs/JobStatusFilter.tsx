'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type FilterStatus = 'all' | 'not_applied' | 'applied'

interface JobStatusFilterProps {
  onFilterChange: (filter: FilterStatus) => void
  currentFilter: FilterStatus
  appliedCount: number
  notAppliedCount: number
}

export function JobStatusFilter({ 
  onFilterChange, 
  currentFilter, 
  appliedCount, 
  notAppliedCount 
}: JobStatusFilterProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>
      
      <Button
        variant={currentFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
      >
        All Jobs
        <Badge variant="secondary" className="ml-2">
          {appliedCount + notAppliedCount}
        </Badge>
      </Button>
      
      <Button
        variant={currentFilter === 'not_applied' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('not_applied')}
      >
        Available to Apply
        <Badge variant="secondary" className="ml-2">
          {notAppliedCount}
        </Badge>
      </Button>
      
      <Button
        variant={currentFilter === 'applied' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('applied')}
      >
        Applied
        <Badge variant="secondary" className="ml-2">
          {appliedCount}
        </Badge>
      </Button>
    </div>
  )
}
