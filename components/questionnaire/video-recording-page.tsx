"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { QuestionnaireData } from "../questionnaire-form"
import { CANDIDATE_VIDEO_BUCKET_NAME } from "@/lib/constant"
import { ChevronLeft } from "lucide-react"
import { Button } from "../ui/button"

interface VideoRecordingPageProps {
  data: QuestionnaireData
  onUpdate: (updates: Partial<QuestionnaireData>) => void
  showErrors?: boolean
  sessionId?: string // Added sessionId prop for better file naming
}

export function VideoRecordingPage({
  data,
  onUpdate,
  showErrors = false,
  sessionId,
}: VideoRecordingPageProps) {
  const supabase = createClient()

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recording, setRecording] = useState(false)
  const [videoURL, setVideoURL] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start recording
  const startRecording = async () => {
    setError(null)
    console.log("startRecording ")
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported in this browser.")
      return
    }
    
    try {
      // Try with more specific constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      }
      
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        setVideoFile(blob)
        setVideoURL(URL.createObjectURL(blob))
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        setRecordingTime(0)
      }

      mediaRecorder.start()
      setRecording(true)
      setRecordingTime(0)

      // Start timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime >= 40) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)

      // Auto-stop after 40 seconds (backup)
      timeoutRef.current = setTimeout(() => {
        stopRecording()
      }, 40000)
    } catch (error) {
      console.error("Error starting recording:", error)
      
      // Try fallback with minimal constraints
      if (error instanceof Error && error.name === 'NotFoundError') {
        console.log("Trying fallback with minimal constraints...")
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
          });
          
          console.log("Fallback successful, got stream:", fallbackStream)
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream
            videoRef.current.play()
          }

          const mediaRecorder = new MediaRecorder(fallbackStream)
          mediaRecorderRef.current = mediaRecorder
          const chunks: Blob[] = []

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data)
          }

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" })
            setVideoFile(blob)
            setVideoURL(URL.createObjectURL(blob))
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            if (timerRef.current) {
              clearInterval(timerRef.current)
            }
            setRecordingTime(0)
          }

          mediaRecorder.start()
          setRecording(true)
          setRecordingTime(0)

          // Start timer for recording duration
          timerRef.current = setInterval(() => {
            setRecordingTime(prev => {
              const newTime = prev + 1
              if (newTime >= 40) {
                stopRecording()
              }
              return newTime
            })
          }, 1000)

          // Auto-stop after 40 seconds (backup)
          timeoutRef.current = setTimeout(() => {
            stopRecording()
          }, 40000)
          
          return; // Success with fallback
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError)
        }
      }
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError("Camera access denied. Please allow camera permissions and try again.")
        } else if (error.name === 'NotFoundError') {
          setError("No camera detected. Please check that your camera is connected and not being used by another application.")
        } else if (error.name === 'NotReadableError') {
          setError("Camera is already in use by another application. Please close other applications and try again.")
        } else if (error.name === 'OverconstrainedError') {
          setError("Camera constraints cannot be satisfied. Please try a different camera or check camera settings.")
        } else {
          setError(`Failed to start recording: ${error.message}`)
        }
      } else {
        setError("An unexpected error occurred while starting the recording.")
      }
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return

    mediaRecorderRef.current.stop()
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    setRecording(false)
    
    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  // Rerecord functionality
  const rerecord = () => {
    // Clear previous recording
    if (videoURL) {
      URL.revokeObjectURL(videoURL)
    }
    setVideoURL(null)
    setVideoFile(null)
    setRecordingTime(0)
    
    // Stop any ongoing recording
    if (recording) {
      stopRecording()
    }
    
    // Start new recording
    startRecording()
  }

  // Upload to Supabase
  const uploadVideo = async () => {
    if (!videoFile) return
    
    setUploading(true)
    setError(null)
    
    try {
      const fileName = `videos/${sessionId || 'anonymous'}_${Date.now()}.webm`
      const { data, error } = await supabase.storage
        .from(CANDIDATE_VIDEO_BUCKET_NAME)
        .upload(fileName, videoFile)

      if (error) {
        console.error("Upload error:", error)
        setError(`Failed to upload video: ${error.message}`)
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from(CANDIDATE_VIDEO_BUCKET_NAME).getPublicUrl(fileName)
        
        // Update the questionnaire data with the video URL
        onUpdate({ video_url: publicUrl })
        
        setError(null)
        // You could show a success message here instead of alert
        alert("Video uploaded successfully!")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError("An unexpected error occurred while uploading the video.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6 pb-2">
          Say Hello to the Hiring Team
        </h2>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Recording a quick intro video helps you stand out from the crowd! Just say hello and tell us why you love working in the industry. 30 seconds max.</span>
            {/* <span className="text-green-600 text-xs italic">
              Optional but highly recommended!
            </span> */}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium">Error:</span>
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Recording Timer */}
          {recording && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 font-medium">Recording...</span>
                <span className="text-red-600 text-sm">
                  {recordingTime}s / 30s max
                </span>
              </div>
              <div className="mt-2 w-full bg-red-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${(recordingTime / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Video Preview */}
          <div className="mb-4">
            <video 
              ref={videoRef} 
              width="400" 
              height="300"
              className="border border-gray-300 rounded-lg"
              style={{ backgroundColor: '#f3f4f6' }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 mb-4">
            {!recording && !videoURL && (
              <Button
                variant="outline"
                onClick={startRecording}
                className="px-4 py-2"
              >
                Start Recording
              </Button>
            )}
            {recording && (
              <Button 
                onClick={stopRecording}
                className="px-4 py-2 bg-red-600"
              >
                Stop Recording
              </Button>
            )}
            
            {videoURL && !recording && (
              <>
                <Button 
                  onClick={rerecord}
                  className="px-4 py-2 bg-orange-600"
                >
                  Rerecord
                </Button>
                <Button 
                  onClick={uploadVideo}
                  disabled={uploading}
                  className="px-4 py-2"
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </Button>
              </>
            )}
          </div>

          {/* Recorded Video Preview */}
          {videoURL && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Your Recording:</h4>
              <video 
                src={videoURL} 
                width="400" 
                height="300"
                controls 
                className="border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
