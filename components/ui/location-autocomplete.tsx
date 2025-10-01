"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "./input"
import { MapPin } from "lucide-react"

interface LocationData {
  route: string
  locality: string
  administrative_area_level_1: string
  place_id: string
  lat: number
  lng: number
  formatted_address: string
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string, locationData?: LocationData) => void
  placeholder?: string
  className?: string
}

interface Prediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Street, City, State",
  className,
}: LocationAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const justSelectedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    console.log(
      "[v0] LocationAutocomplete useEffect triggered - value:",
      value,
      "justSelected:",
      justSelectedRef.current,
    )

    if (justSelectedRef.current) {
      console.log("[v0] Skipping search because justSelected is true")
      justSelectedRef.current = false
      return
    }

    if (!value || value.length < 2) {
      console.log("[v0] Clearing predictions - value too short")
      setPredictions([])
      setShowDropdown(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      if (justSelectedRef.current) {
        console.log("[v0] Skipping search in timeout because justSelected is true")
        return
      }

      console.log("[v0] Starting location search after timeout")
      setIsLoading(true)
      try {
        console.log("[v0] Searching locations for:", value)
        const response = await fetch(`/api/autocomplete-location?input=${encodeURIComponent(value)}`)
        const data = await response.json()

        if (response.ok && data.predictions) {
          console.log("[v0] Received", data.predictions.length, "location predictions")
          setPredictions(data.predictions)
          setShowDropdown(true)
          setSelectedIndex(-1)
        } else {
          console.error("[v0] Location autocomplete error:", data.error)
          setPredictions([])
          setShowDropdown(false)
        }
      } catch (error) {
        console.error("[v0] Location search error:", error)
        setPredictions([])
        setShowDropdown(false)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      console.log("[v0] Clearing timeout")
      clearTimeout(timeoutId)
    }
  }, [value])

  const handleSelect = async (prediction: Prediction) => {
    console.log("[v0] handleSelect called for:", prediction.description)
    console.log("[v0] Setting justSelected to true and hiding dropdown")

    justSelectedRef.current = true
    setShowDropdown(false)
    setPredictions([])
    setIsLoading(true)

    try {
      const response = await fetch(`/api/place-details-location?place_id=${encodeURIComponent(prediction.place_id)}`)
      const locationData = await response.json()

      if (response.ok) {
        console.log("[v0] Location details received:", locationData)

        const displayParts = []
        if (locationData.route) displayParts.push(locationData.route)
        if (locationData.locality) displayParts.push(locationData.locality)
        if (locationData.administrative_area_level_1) displayParts.push(locationData.administrative_area_level_1)

        const displayText = displayParts.join(", ")
        console.log("[v0] Calling onChange with displayText:", displayText)

        onChange(displayText, locationData)
      } else {
        console.error("[v0] Failed to get location details:", locationData.error)
        onChange(prediction.description)
      }
    } catch (error) {
      console.error("[v0] Error fetching location details:", error)
      onChange(prediction.description)
    } finally {
      setIsLoading(false)
      console.log("[v0] handleSelect completed")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSelect(predictions[selectedIndex])
        }
        break
      case "Escape":
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
          autoComplete="off"
        />
      </div>

      {showDropdown && (predictions.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading && <div className="px-4 py-2 text-sm text-gray-500">Searching locations...</div>}

          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? "bg-gray-50" : ""
              }`}
              onClick={() => handleSelect(prediction)}
            >
              <div className="text-sm font-medium text-gray-900">{prediction.structured_formatting.main_text}</div>
              <div className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
