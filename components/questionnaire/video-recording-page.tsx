"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { QuestionnaireData } from "../questionnaire-form"
import { CANDIDATE_VIDEO_BUCKET_NAME } from "@/lib/constants"
import { ChevronLeft } from "lucide-react"
import { Button } from "../ui/button"

interface VideoRecordingPageProps {
  data: QuestionnaireData
  onUpdate: (updates: Partial<QuestionnaireData>) => void
  showErrors?: boolean
  sessionId?: string // Added sessionId prop for better file naming
  onNextPage: () => void
}

export function VideoRecordingPage({
  data,
  onUpdate,
  showErrors = false,
  sessionId,
  onNextPage,
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
  const [cameraActive, setCameraActive] = useState(false)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start camera preview automatically when component mounts
  useEffect(() => {
    const initializeCamera = async () => {
      setError(null)

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera access is not supported in this browser.")
        return
      }

      try {
        // Request camera access for preview
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false, // No audio needed for preview
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          // Don't auto-play to avoid full-screen camera view
          // videoRef.current.play()
        }

        setPreviewStream(stream)
        setCameraActive(true)
      } catch (error) {
        console.error("Error starting camera preview:", error)

        if (error instanceof Error) {
          if (error.name === "NotAllowedError") {
            setError(
              "Camera access denied. Please allow camera permissions and try again."
            )
          } else if (error.name === "NotFoundError") {
            setError(
              "No camera detected. Please check that your camera is connected."
            )
          } else if (error.name === "NotReadableError") {
            setError("Camera is already in use by another application.")
          } else {
            setError(`Failed to start camera preview: ${error.message}`)
          }
        } else {
          setError(
            "An unexpected error occurred while starting the camera preview."
          )
        }
      }
    }

    initializeCamera()

    // Cleanup on unmount
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  // Start camera preview (for retry button)
  const startCameraPreview = async () => {
    setError(null)

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported in this browser.")
      return
    }

    try {
      // Request camera access for preview
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false, // No audio needed for preview
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Don't auto-play to avoid full-screen camera view
        // videoRef.current.play()
      }

      setPreviewStream(stream)
      setCameraActive(true)
    } catch (error) {
      console.error("Error starting camera preview:", error)

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setError(
            "Camera access denied. Please allow camera permissions and try again."
          )
        } else if (error.name === "NotFoundError") {
          setError(
            "No camera detected. Please check that your camera is connected."
          )
        } else if (error.name === "NotReadableError") {
          setError("Camera is already in use by another application.")
        } else {
          setError(`Failed to start camera preview: ${error.message}`)
        }
      } else {
        setError(
          "An unexpected error occurred while starting the camera preview."
        )
      }
    }
  }

  // Stop camera preview
  const stopCameraPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop())
      setPreviewStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // Start recording
  const startRecording = async () => {
    setError(null)
    console.log("startRecording ")

    // If we don't have a preview stream, start camera preview first
    if (!previewStream) {
      await startCameraPreview()
      if (!previewStream) return // Failed to start preview
    }

    try {
      // Request audio access for recording (video already available from preview)
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      // Create separate streams for video element and recording
      // Video element should only show video (no audio)
      const videoOnlyStream = new MediaStream([
        ...previewStream!.getVideoTracks(),
      ])

      // Recording stream includes both video and audio
      const recordingStream = new MediaStream([
        ...previewStream!.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ])

      // Update video element to show only video (no audio)
      if (videoRef.current) {
        videoRef.current.srcObject = videoOnlyStream
        videoRef.current.muted = true // Ensure no audio plays
      }
      // Check for supported MIME types (mobile compatibility)
      let mimeType = "video/webm"
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/mp4"
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm;codecs=vp8"
        }
      }
      console.log("Using MIME type:", mimeType)

      const mediaRecorder = new MediaRecorder(recordingStream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        console.log("MediaRecorder data available:", e.data.size, "bytes")
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped, chunks:", chunks.length)
        const blob = new Blob(chunks, { type: mimeType })
        console.log("Created blob:", blob.size, "bytes")
        const videoUrl = URL.createObjectURL(blob)
        console.log("Created video URL:", videoUrl)
        setVideoFile(blob)
        setVideoURL(videoUrl)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        setRecordingTime(0)
      }

      mediaRecorder.start()
      console.log("MediaRecorder started with stream:", recordingStream)
      console.log("Video tracks:", recordingStream.getVideoTracks().length)
      console.log("Audio tracks:", recordingStream.getAudioTracks().length)
      setRecording(true)
      setRecordingTime(0)

      // Start timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
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
      if (error instanceof Error && error.name === "NotFoundError") {
        console.log("Trying fallback with minimal constraints...")
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false,
          })

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
            setRecordingTime((prev) => {
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

          return // Success with fallback
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError)
        }
      }

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setError(
            "Camera access denied. Please allow camera permissions and try again."
          )
        } else if (error.name === "NotFoundError") {
          setError(
            "No camera detected. Please check that your camera is connected and not being used by another application."
          )
        } else if (error.name === "NotReadableError") {
          setError(
            "Camera is already in use by another application. Please close other applications and try again."
          )
        } else if (error.name === "OverconstrainedError") {
          setError(
            "Camera constraints cannot be satisfied. Please try a different camera or check camera settings."
          )
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

    // Stop the audio tracks from the recording stream
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream
        .getAudioTracks()
        .forEach((track) => track.stop())
    }

    // Restore the original preview stream to the video element
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream
      videoRef.current.muted = true // Keep muted to prevent any audio feedback
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

    // Start new recording (camera preview should still be active)
    startRecording()
  }

  // Upload to Supabase
  const uploadVideo = async () => {
    if (!videoFile) return

    setUploading(true)
    setError(null)

    try {
      const fileExt = "mp4"
      const timestamp = Date.now()

      const fileName = sessionId
        ? `${sessionId}-video-${timestamp}.${fileExt}`
        : `video-${timestamp}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`

      const { data, error } = await supabase.storage
        .from(CANDIDATE_VIDEO_BUCKET_NAME)
        .upload(fileName, videoFile)

      if (error) {
        console.error("Upload error:", error)
        setError(`Failed to upload video: ${error.message}`)
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from(CANDIDATE_VIDEO_BUCKET_NAME)
          .getPublicUrl(fileName)

        // Update the questionnaire data with the video URL
        onUpdate({ video_url: publicUrl })
        onNextPage()

        setError(null)
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
            <span className="text-sm font-medium">
              Recording a quick intro video helps you stand out from the crowd!
              Just say hello and tell us why you love working in the industry.
              30 seconds max.
            </span>
            {/* <span className="text-green-600 text-xs italic">
              Optional but highly recommended!
            </span> */}
          </div>
          <div className="flex gap-3 mb-4">
            {!recording && !videoURL && cameraActive && (
              <Button
                variant="outline"
                onClick={startRecording}
                className="px-4 py-2"
              >
                Start Recording
              </Button>
            )}
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
          <div className="mb-4 relative">
            <video
              ref={videoRef}
              width="400"
              height="300"
              className="border border-gray-300 rounded-lg"
              style={{ backgroundColor: "#f3f4f6" }}
              muted
              playsInline
              autoPlay
            />

            {/* Loading overlay when camera is starting */}
            {!cameraActive && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm font-medium">Starting Camera...</p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {error && !cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Camera Error</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click "Retry Camera" to try again
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 mb-4">
            {error && !cameraActive && (
              <Button
                variant="outline"
                onClick={startCameraPreview}
                className="px-4 py-2"
              >
                Retry Camera
              </Button>
            )}
            {recording && (
              <Button onClick={stopRecording} className="px-4 py-2 bg-red-600">
                Stop Recording
              </Button>
            )}

            {videoURL && !recording && (
              <>
                <Button onClick={rerecord} className="px-4 py-2 bg-orange-600">
                  Rerecord
                </Button>
                <Button
                  onClick={uploadVideo}
                  disabled={uploading}
                  className="px-4 py-2"
                >
                  {uploading ? "Uploading..." : "Upload Video"}
                </Button>
              </>
            )}
          </div>

          {/* Recorded Video Preview */}
          {videoURL && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Your Recording:
              </h4>
              <video
                src={videoURL}
                width="400"
                height="300"
                controls
                playsInline
                preload="metadata"
                className="border border-gray-300 rounded-lg"
                onError={(e) => {
                  console.error("Video playback error:", e)
                  console.error("Video src:", videoURL)
                }}
                onLoadStart={() => console.log("Video loading started")}
                onCanPlay={() => console.log("Video can play")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
