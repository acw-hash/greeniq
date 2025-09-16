"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useUIStore } from '@/lib/stores/uiStore'
import { Upload, Camera, X, Check } from 'lucide-react'
import Image from 'next/image'

interface AvatarUploadProps {
  currentAvatar?: string | null
  onUploadSuccess: (avatarUrl: string) => void
  className?: string
}

export function AvatarUpload({ currentAvatar, onUploadSuccess, className }: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useUIStore()

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a JPEG, PNG, or WebP image file.'
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 5MB.'
    }

    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      addToast({
        variant: 'destructive',
        title: 'Invalid file',
        description: error
      })
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [addToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch('/api/profiles/upload-image', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      
      addToast({
        variant: 'success',
        title: 'Success!',
        description: 'Profile picture updated successfully.'
      })

      onUploadSuccess(result.avatar_url)
      
      // Reset state
      setSelectedFile(null)
      setPreviewImage(null)
      setUploadProgress(0)

    } catch (error) {
      console.error('Upload error:', error)
      addToast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image'
      })
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewImage(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSelectClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Current Avatar Display */}
      {currentAvatar && !previewImage && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Current Profile Picture</p>
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={currentAvatar}
              alt="Current profile picture"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Upload Area */}
      <Card className={`transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-dashed border-gray-300'}`}>
        <CardContent className="p-6">
          {previewImage ? (
            /* Preview State */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedFile && (selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-gray-500">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Upload State */
            <div
              className="text-center py-8"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Profile Picture
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop an image here, or click to select
              </p>
              
              <Button onClick={handleSelectClick} className="mb-4">
                <Upload className="mr-2 h-4 w-4" />
                Select Image
              </Button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>Supported formats: JPEG, PNG, WebP</p>
                <p>Maximum size: 5MB</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
