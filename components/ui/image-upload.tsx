"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ImageUploadProps {
  id: string
  label: string
  value?: string
  onChange: (url: string | null) => void
  bucketName?: string
  maxSizeMB?: number
  sessionId?: string // Added sessionId for better file naming
}

export function ImageUpload({
  id,
  label,
  value,
  onChange,
  bucketName = "headshots",
  maxSizeMB = 5,
  sessionId,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const timestamp = Date.now()

      const fileName = sessionId
        ? `${sessionId}-headshot-${timestamp}.${fileExt}`
        : `headshot-${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName)

      onChange(publicUrl)
    } catch (error) {
      console.error("Upload error:", error)
      setError("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (value) {
      try {
        // Extract filename from URL to delete from storage
        const url = new URL(value)
        const fileName = url.pathname.split("/").pop()

        if (fileName) {
          await supabase.storage.from(bucketName).remove([fileName])
        }
      } catch (error) {
        console.error("Error removing file:", error)
      }
    }

    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20 border-2 border-gray-200">
          <AvatarImage src={value || undefined} alt="Headshot" />
          <AvatarFallback>
            <User className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : value ? "Change Photo" : "Upload Photo"}
          </Button>

          {value && (
            <Button type="button" variant="outline" size="sm" onClick={handleRemove} disabled={isUploading}>
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-muted-foreground">Upload specs: max {maxSizeMB}MB, JPG/PNG</p>
    </div>
  )
}
