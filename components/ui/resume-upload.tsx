"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, X } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface ResumeUploadProps {
  value?: string
  onChange: (url: string | null) => void
  className?: string
  sessionId?: string // Added sessionId prop for better file naming
}

export function ResumeUpload({ value, onChange, className, sessionId }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF or Word document")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const timestamp = Date.now()

      const fileName = sessionId
        ? `session-${sessionId}-resume-${timestamp}.${fileExt}`
        : `resume-${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage.from("candidate-resumes").upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("candidate-resumes").getPublicUrl(fileName)

      onChange(publicUrl)
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload resume. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (value) {
      try {
        // Extract filename from URL
        const fileName = value.split("/").pop()
        if (fileName) {
          await supabase.storage.from("candidate-resumes").remove([fileName])
        }
      } catch (err) {
        console.error("Error removing file:", err)
      }
    }
    onChange(null)
  }

  return (
    <div className={className}>
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />

      {!value ? (
        <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mb-2"
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </Button>
            <p className="text-sm text-gray-500 text-center">PDF or Word document (max 5MB)</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-medium">Resume uploaded</p>
                <p className="text-sm text-gray-500">Resume ready for submission</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
