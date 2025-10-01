"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GooglePlacesAutocomplete } from "@/components/ui/google-places-autocomplete"
import { ResumeUpload } from "@/components/ui/resume-upload"
import type { QuestionnaireData } from "../questionnaire-form"
import React from "react"

interface ExperiencePageProps {
  data: QuestionnaireData
  onUpdate: (updates: Partial<QuestionnaireData>) => void
  sessionId?: string // Added sessionId prop for better file naming
}

export function ExperiencePage({ data, onUpdate, sessionId }: ExperiencePageProps) {
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const updateExperience = (index: number, field: string, value: string, placeDetails?: any) => {
    const updatedExperiences = [...data.experiences]

    if (field === "restaurant" && placeDetails) {
      // Store all Google Places data when restaurant is selected
      updatedExperiences[index] = {
        ...updatedExperiences[index],
        restaurant: value,
        restaurantPlaceId: placeDetails.place_id,
        restaurantName: placeDetails.name,
        restaurantAddress: placeDetails.formatted_address,
        restaurantPriceLevel: placeDetails.price_level,
        restaurantTypes: placeDetails.types,
        restaurantRating: placeDetails.rating,
        restaurantUserRatingsTotal: placeDetails.user_ratings_total,
      }
    } else {
      updatedExperiences[index] = {
        ...updatedExperiences[index],
        [field]: value,
      }
    }

    onUpdate({ experiences: updatedExperiences })
  }

  const handleResumeUpload = (url: string | null) => {
    onUpdate({ resume: url })
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

  const getCardTitle = (index: number) => {
    if (index === 0) return "Most Recent Experience *"
    return "Other Experience"
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Previous Experience</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide details about your previous restaurant experience
        </p>

        {data.experiences.map((experience, index) => (
          <Card key={index} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">{getCardTitle(index)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`role-${index}`}>Role{index === 0 ? " *" : ""}</Label>
                  <Input
                    id={`role-${index}`}
                    value={experience.role}
                    onChange={(e) => updateExperience(index, "role", e.target.value)}
                    placeholder="e.g., Server, Bartender, Cook"
                  />
                </div>

                <div>
                  <Label htmlFor={`restaurant-${index}`}>Restaurant{index === 0 ? " *" : ""}</Label>
                  <GooglePlacesAutocomplete
                    value={experience.restaurant}
                    onChange={(value, details) => updateExperience(index, "restaurant", value, details)}
                    placeholder="Search for restaurant..."
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Start Month{index === 0 ? " *" : ""}</Label>
                    <Select
                      value={experience.startMonth || ""}
                      onValueChange={(value) => updateExperience(index, "startMonth", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Year{index === 0 ? " *" : ""}</Label>
                    <Select
                      value={experience.startYear || ""}
                      onValueChange={(value) => updateExperience(index, "startYear", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>End Month{index === 0 ? " *" : ""}</Label>
                    <Select
                      value={experience.endMonth || ""}
                      onValueChange={(value) => updateExperience(index, "endMonth", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {index === 0 && <SelectItem value="Present">Present</SelectItem>}
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>End Year{index === 0 ? " *" : ""}</Label>
                    <Select
                      value={experience.endYear || ""}
                      onValueChange={(value) => updateExperience(index, "endYear", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {index === 0 && <SelectItem value="Present">Present</SelectItem>}
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Upload your Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResumeUpload
              value={data.resume}
              onChange={handleResumeUpload}
              className="w-full"
              sessionId={sessionId} // Pass sessionId for better file naming
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ExperiencePage
