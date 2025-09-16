"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Image, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  accept?: Record<string, string[]>
  maxSize?: number
  multiple?: boolean
  value?: File | string
  disabled?: boolean
  error?: string
  className?: string
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf']
  },
  maxSize = 5 * 1024 * 1024, // 5MB default
  multiple = false,
  value,
  disabled = false,
  error,
  className,
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setUploadStatus('error')
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadStatus('uploading')
      setUploadProgress(0)

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Complete upload
      setTimeout(() => {
        clearInterval(interval)
        setUploadProgress(100)
        setUploadStatus('success')
        onFileSelect(file)
        
        // Reset status after delay
        setTimeout(() => {
          setUploadStatus('idle')
          setUploadProgress(0)
        }, 1000)
      }, 1000)
    }
  }, [onFileSelect])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled: disabled || uploadStatus === 'uploading'
  })

  const getFileIcon = (file: File | string) => {
    if (typeof file === 'string') {
      return file.includes('image') ? <Image className="h-8 w-8" /> : <File className="h-8 w-8" />
    }
    return file.type.startsWith('image/') ? <Image className="h-8 w-8" /> : <File className="h-8 w-8" />
  }

  const getFileName = (file: File | string) => {
    if (typeof file === 'string') {
      return file.split('/').pop() || 'Uploaded file'
    }
    return file.name
  }

  const getFileSize = (file: File | string) => {
    if (typeof file === 'string') return ''
    const size = file.size
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleRemove = () => {
    if (onFileRemove) {
      onFileRemove()
    }
    setUploadStatus('idle')
    setUploadProgress(0)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current file display */}
      {value && uploadStatus !== 'uploading' && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
          <div className="flex items-center space-x-3">
            {getFileIcon(value)}
            <div>
              <p className="text-sm font-medium">{getFileName(value)}</p>
              {typeof value !== 'string' && (
                <p className="text-xs text-muted-foreground">{getFileSize(value)}</p>
              )}
            </div>
          </div>
          {uploadStatus === 'success' && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {onFileRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Upload progress */}
      {uploadStatus === 'uploading' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Drop zone */}
      {(!value || uploadStatus === 'uploading') && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary/50 hover:bg-muted/50",
            isDragActive && "border-primary bg-primary/5",
            isDragReject && "border-destructive bg-destructive/5",
            disabled && "cursor-not-allowed opacity-50",
            uploadStatus === 'error' && "border-destructive bg-destructive/5"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-2">
            {uploadStatus === 'error' ? (
              <AlertCircle className="h-8 w-8 text-destructive" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            
            <div className="space-y-1">
              {isDragActive ? (
                <p className="text-sm font-medium">Drop the file here</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Drag & drop a file here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: {Object.values(accept).flat().join(', ')} • Max {Math.round(maxSize / (1024 * 1024))}MB
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error messages */}
      {(error || fileRejections.length > 0) && (
        <div className="text-sm text-destructive">
          {error || fileRejections[0]?.errors[0]?.message}
        </div>
      )}
    </div>
  )
}
