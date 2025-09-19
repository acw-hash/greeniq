"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Image, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  bucket: string
  path: string
  onUpload: (urls: string[]) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
  error?: string
  className?: string
}

export function FileUpload({
  bucket,
  path,
  onUpload,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  },
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  error,
  className,
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setUploadStatus('error')
      return
    }

    if (acceptedFiles.length > 0) {
      setUploadStatus('uploading')
      setUploadProgress(0)

      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          // Create a unique filename
          const timestamp = Date.now()
          const fileExtension = file.name.split('.').pop()
          const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
          const filePath = `${path}${fileName}`

          // For now, we'll simulate the upload and return a mock URL
          // In a real implementation, you would upload to Supabase Storage here
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          return `https://example.com/${bucket}/${filePath}`
        })

        const urls = await Promise.all(uploadPromises)
        setUploadedFiles(prev => [...prev, ...urls])
        setUploadStatus('success')
        onUpload([...uploadedFiles, ...urls])

        // Reset status after delay
        setTimeout(() => {
          setUploadStatus('idle')
          setUploadProgress(0)
        }, 1000)

      } catch (error) {
        console.error('Upload error:', error)
        setUploadStatus('error')
      }
    }
  }, [bucket, path, onUpload, uploadedFiles])

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
    multiple: maxFiles > 1,
    disabled: disabled || uploadStatus === 'uploading'
  })

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onUpload(newFiles)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Uploaded files display */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedFiles.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
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
      {uploadedFiles.length < maxFiles && (
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
                <p className="text-sm font-medium">Drop the files here</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: {Object.values(accept).flat().join(', ')} • Max {Math.round(maxSize / (1024 * 1024))}MB
                    {maxFiles > 1 && ` • Up to ${maxFiles} files`}
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
