export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface Location {
  lat: number
  lng: number
}

export interface Address {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export interface FileUpload {
  file: File
  preview?: string
  progress?: number
  error?: string
}

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}
