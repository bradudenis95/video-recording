"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"

interface PlaceResult {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  price_level?: number
  types?: string[]
  rating?: number
  user_ratings_total?: number
}

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string, details?: PlaceDetails) => void
  placeholder?: string
  className?: string
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Search restaurants...",
  className = "",
}: GooglePlacesAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const justSelectedRef = useRef(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    console.log(
      "[v0] GooglePlaces useEffect triggered - inputValue:",
      inputValue,
      "justSelected:",
      justSelectedRef.current,
    )

    if (justSelectedRef.current) {
      console.log("[v0] Skipping search because justSelected is true")
      justSelectedRef.current = false
      return
    }

    if (!inputValue.trim()) {
      console.log("[v0] Clearing suggestions - inputValue is empty")
      setSuggestions([])
      setIsOpen(false)
      return
    }

    console.log("[v0] Starting search for:", inputValue)

    const timeoutId = setTimeout(async () => {
      console.log("[v0] Starting restaurant search after timeout")
      setLoading(true)
      try {
        console.log("[v0] Making API call to /api/autocomplete")
        const response = await fetch(`/api/autocomplete?input=${encodeURIComponent(inputValue)}`)
        console.log("[v0] API response status:", response.status)

        const data = await response.json()
        console.log("[v0] API response data:", data)

        if (data.predictions) {
          console.log("[v0] Found predictions:", data.predictions.length)
          setSuggestions(data.predictions)
          setIsOpen(true)
        } else {
          console.log("[v0] No predictions in response")
        }
      } catch (error) {
        console.error("[v0] Autocomplete error:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      console.log("[v0] Clearing restaurant search timeout")
      clearTimeout(timeoutId)
    }
  }, [inputValue])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = async (place: PlaceResult) => {
    console.log("[v0] handleSelect called for restaurant:", place.structured_formatting.main_text)
    console.log("[v0] Setting justSelected to true and hiding dropdown")

    justSelectedRef.current = true
    setInputValue(place.structured_formatting.main_text)
    setIsOpen(false)
    setSuggestions([])

    // Fetch detailed place information
    try {
      console.log("[v0] Fetching place details for:", place.place_id)
      const response = await fetch(`/api/place-details?place_id=${place.place_id}`)
      const data = await response.json()
      console.log("[v0] Place details response:", data)

      if (data.result) {
        const details: PlaceDetails = {
          place_id: data.result.place_id,
          name: data.result.name,
          formatted_address: data.result.formatted_address,
          price_level: data.result.price_level,
          types: data.result.types,
          rating: data.result.rating,
          user_ratings_total: data.result.user_ratings_total,
        }
        console.log("[v0] Calling onChange with restaurant details:", details)
        onChange(place.structured_formatting.main_text, details)
      } else {
        onChange(place.structured_formatting.main_text)
      }
    } catch (error) {
      console.error("[v0] Place details error:", error)
      onChange(place.structured_formatting.main_text)
    }

    console.log("[v0] Restaurant handleSelect completed")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log("[v0] Input changed to:", newValue)
    setInputValue(newValue)
    onChange(newValue) // Update parent with text value
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={className}
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Searching...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((place) => (
              <button
                key={place.place_id}
                onClick={() => handleSelect(place)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <div className="font-medium text-gray-900">{place.structured_formatting.main_text}</div>
                <div className="text-sm text-gray-500">{place.structured_formatting.secondary_text}</div>
              </button>
            ))
          ) : inputValue.trim() && !loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">No restaurants found</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
