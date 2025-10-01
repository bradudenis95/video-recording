"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { QuestionnaireData } from "../questionnaire-form"

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Start recording
  const startRecording = async () => {
    console.log("startRecording ")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

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
      }

      mediaRecorder.start()
      setRecording(true)

      // Auto-stop after 40 seconds
      timeoutRef.current = setTimeout(() => {
        stopRecording()
      }, 40000)
    } catch (error) {
      console.error("Error starting recording:", error)
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
  }

  // Upload to Supabase
  const uploadVideo = async () => {
    if (!videoFile) return
    const fileName = `videos/${Date.now()}.webm`
    const { data, error } = await supabase.storage
      .from("videos")
      .upload(fileName, videoFile)

    if (error) {
      console.error("Upload error:", error)
    } else {
      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(fileName)
      alert("Video uploaded! URL: " + publicUrl)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6 pb-2">
          Say Hello to the Hiring Team
        </h2>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Intro Video</span>
            <span className="text-green-600 text-xs italic">
              Optional but highly recommended!
            </span>
          </div>
          <div>
            <video ref={videoRef} width="400" controls />
            <div style={{ marginTop: "10px" }}>
              {!recording ? (
                <button onClick={startRecording}>Start Recording</button>
              ) : (
                <button onClick={stopRecording}>Stop Recording</button>
              )}
              {videoURL && <button onClick={uploadVideo}>Upload Video</button>}
            </div>
            {videoURL && (
              <div>
                <h4>Preview:</h4>
                <video src={videoURL} width="400" controls />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
