// Simple toast implementation using browser alerts for now
// In production, you would use a proper toast library like sonner or react-hot-toast

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export const toast = (options: ToastOptions) => {
  const { title, description, variant = 'default' } = options
  const message = title ? `${title}: ${description || ''}` : description || ''
  
  if (variant === 'destructive') {
    console.error('❌ Error:', message)
    if (typeof window !== 'undefined') {
      alert(`❌ ${message}`)
    }
  } else {
    console.log('✅ Success:', message)
    if (typeof window !== 'undefined') {
      alert(`✅ ${message}`)
    }
  }
}

// Legacy methods for backward compatibility
toast.success = (message: string) => {
  console.log('✅ Success:', message)
  if (typeof window !== 'undefined') {
    alert(`✅ ${message}`)
  }
}

toast.error = (message: string) => {
  console.error('❌ Error:', message)
  if (typeof window !== 'undefined') {
    alert(`❌ ${message}`)
  }
}

toast.info = (message: string) => {
  console.log('ℹ️ Info:', message)
  if (typeof window !== 'undefined') {
    alert(`ℹ️ ${message}`)
  }
}

toast.warning = (message: string) => {
  console.warn('⚠️ Warning:', message)
  if (typeof window !== 'undefined') {
    alert(`⚠️ ${message}`)
  }
}