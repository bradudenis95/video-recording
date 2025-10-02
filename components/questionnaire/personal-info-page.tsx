"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LocationAutocomplete } from "@/components/ui/location-autocomplete"
import { ImageUpload } from "@/components/ui/image-upload"
import { createClient } from "@/lib/supabase/client"
import type { QuestionnaireData } from "../questionnaire-form"
import { CANDIDATE_HEADSHOTS_BUCKET_NAME } from "@/lib/constants"

interface PersonalInfoPageProps {
  data: QuestionnaireData
  onUpdate: (updates: Partial<QuestionnaireData>) => void
  showErrors?: boolean
  sessionId?: string // Added sessionId prop for better file naming
}

export function PersonalInfoPage({
  data,
  onUpdate,
  showErrors = false,
  sessionId,
}: PersonalInfoPageProps) {
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchPositions = async () => {
      const { data: positionsData } = await supabase
        .from("positions")
        .select("id, name")
        .order("display_order")

      if (positionsData) {
        setPositions(positionsData)
      }
    }

    fetchPositions()
  }, [supabase])

  const validatePhoneNumber = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, "")
    return digitsOnly.length === 10
  }

  const validateEmail = (email: string) => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const getLocationError = () => {
    if (!showErrors) return ""
    return data.location ? "" : "Address is required"
  }

  const getPositionError = () => {
    if (!showErrors) return ""
    return data.positionId ? "" : "Position is required"
  }

  const formatPhoneNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "")
    if (digitsOnly.length <= 3) {
      return digitsOnly
    } else if (digitsOnly.length <= 6) {
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`
    } else {
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
        3,
        6
      )}-${digitsOnly.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    onUpdate({ phoneNumber: formatted })
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    onUpdate({ email })
  }

  const handleLocationChange = (value: string, locationData?: any) => {
    if (locationData) {
      onUpdate({
        location: value,
        locationRoute: locationData.route,
        locationLocality: locationData.locality,
        locationState: locationData.administrative_area_level_1,
        locationPlaceId: locationData.place_id,
        locationLat: locationData.lat,
        locationLng: locationData.lng,
      })
    } else {
      onUpdate({ location: value })
    }
  }

  const phoneError =
    showErrors && !validatePhoneNumber(data.phoneNumber)
      ? "Phone number must be exactly 10 digits"
      : ""
  const emailError =
    showErrors && !validateEmail(data.email)
      ? "Please enter a valid email address"
      : ""
  const locationError = getLocationError()
  const positionError = getPositionError()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6 pb-2">
          Personal Information
        </h2>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Profile Picture</span>
            <span className="text-green-600 text-xs italic">
              Optional but highly recommended!
            </span>
          </div>
          <ImageUpload
            id="headshot"
            label=""
            value={data.headshot || undefined}
            onChange={(url) => onUpdate({ headshot: url })}
            bucketName={CANDIDATE_HEADSHOTS_BUCKET_NAME}
            maxSizeMB={5}
            description="Upload specs: max 5MB, JPG/PNG"
            sessionId={sessionId} // Pass sessionId for better file naming
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
              placeholder="Enter your last name"
              required
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={data.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="123-456-7890"
              required
              className={phoneError ? "border-red-500" : ""}
            />
            {phoneError && (
              <p className="text-red-500 text-sm mt-1">{phoneError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={handleEmailChange}
              placeholder="your.email@example.com"
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="location">Address *</Label>
            <LocationAutocomplete
              value={data.location}
              onChange={handleLocationChange}
              placeholder="Street, City, State"
              className={locationError ? "border-red-500" : ""}
            />
            <p className="text-gray-500 text-xs italic mt-1">
              We need your street for ideal job matching but we will not store
              your street number for privacy
            </p>
            {locationError && (
              <p className="text-red-500 text-sm mt-1">{locationError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="position">Position *</Label>
            <Select
              value={data.positionId?.toString() || ""}
              onValueChange={(value) =>
                onUpdate({ positionId: Number.parseInt(value) })
              }
            >
              <SelectTrigger className={positionError ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id.toString()}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {positionError && (
              <p className="text-red-500 text-sm mt-1">{positionError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
