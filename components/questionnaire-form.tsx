"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PersonalInfoPage } from "./questionnaire/personal-info-page"
import { BioSkillsPage } from "./questionnaire/bio-skills-page"
import { ExperiencePage } from "./questionnaire/experience-page"
import { AvailabilityPage } from "./questionnaire/availability-page"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { VideoRecordingPage } from "./questionnaire/video-recording-page"

export interface QuestionnaireData {
  id?: string
  // Page 1
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  location?: string
  locationRoute?: string
  locationLocality?: string
  locationState?: string
  locationPlaceId?: string
  locationLat?: number
  locationLng?: number
  positionId?: number
  headshot: string | null
  video_url?: string | null
  // Page 2
  bio: string
  selectedSkills: string[]
  // Page 3
  resume: string | null
  experiences: Array<{
    role: string
    startMonth: string
    startYear: string
    endMonth: string
    endYear: string
    restaurant: string
    restaurantPlaceId?: string
    restaurantName?: string
    restaurantAddress?: string
    restaurantPriceLevel?: number
    restaurantTypes?: string[]
    restaurantRating?: number
    restaurantUserRatingsTotal?: number
  }>
  // Page 4
  shiftAvailability: Record<string, boolean>
  interviewSlots: string[]
}

const initialData: QuestionnaireData = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  email: "",
  locationRoute: "",
  locationLocality: "",
  locationState: "",
  locationPlaceId: "",
  locationLat: undefined,
  locationLng: undefined,
  positionId: undefined,
  headshot: null,
  video_url: null,
  bio: "",
  selectedSkills: [],
  resume: null,
  experiences: [
    {
      role: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      restaurant: "",
    },
    {
      role: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      restaurant: "",
    },
    {
      role: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      restaurant: "",
    },
  ],
  shiftAvailability: {},
  interviewSlots: [],
}

export function QuestionnaireForm() {
  const [currentPage, setCurrentPage] = useState(2)
  const [data, setData] = useState<QuestionnaireData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substring(2)}`
  )

  const supabase = createClient()
  const router = useRouter()
  const totalPages = 5
  const progress = (currentPage / totalPages) * 100

  const goToNextPage = () => {
    setCurrentPage(currentPage + 1)
  }

  const handleSubmit = async () => {
    setShowErrors(true)

    if (!isCurrentPageValid()) {
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Starting form submission with data:", data)

      const candidateData: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phoneNumber,
        email: data.email,
        location_route: data.locationRoute,
        location_locality: data.locationLocality,
        location_state: data.locationState,
        location_place_id: data.locationPlaceId,
        location_lat: data.locationLat,
        location_lng: data.locationLng,
        position_id: data.positionId || null,
        headshot_url: data.headshot,
        resume_url: data.resume,
        bio: data.bio,
        session_id: sessionId,
        video_url: data.video_url,
      }

      data.selectedSkills.forEach((skill, index) => {
        if (index < 8) {
          candidateData[`skill_${index + 1}`] = skill
        }
      })

      console.log("[v0] Inserting candidate data:", candidateData)

      const { data: newCandidate, error: candidateError } = await supabase
        .from("candidates")
        .insert(candidateData)
        .select()
        .single()

      if (candidateError) {
        console.log("[v0] Candidate insertion error:", candidateError)
        throw candidateError
      }

      console.log("[v0] Candidate created successfully:", newCandidate)
      const candidateId = newCandidate.id

      const shiftsData = {
        candidate_id: candidateId,
        first_name: data.firstName,
        last_name: data.lastName,
        monday_lunch: data.shiftAvailability["monday-lunch"] || false,
        monday_dinner: data.shiftAvailability["monday-dinner"] || false,
        tuesday_lunch: data.shiftAvailability["tuesday-lunch"] || false,
        tuesday_dinner: data.shiftAvailability["tuesday-dinner"] || false,
        wednesday_lunch: data.shiftAvailability["wednesday-lunch"] || false,
        wednesday_dinner: data.shiftAvailability["wednesday-dinner"] || false,
        thursday_lunch: data.shiftAvailability["thursday-lunch"] || false,
        thursday_dinner: data.shiftAvailability["thursday-dinner"] || false,
        friday_lunch: data.shiftAvailability["friday-lunch"] || false,
        friday_dinner: data.shiftAvailability["friday-dinner"] || false,
        saturday_lunch: data.shiftAvailability["saturday-lunch"] || false,
        saturday_dinner: data.shiftAvailability["saturday-dinner"] || false,
        sunday_lunch: data.shiftAvailability["sunday-lunch"] || false,
        sunday_dinner: data.shiftAvailability["sunday-dinner"] || false,
      }

      console.log("[v0] Inserting shifts data:", shiftsData)

      const { error: shiftError } = await supabase
        .from("candidate_shifts")
        .insert([shiftsData])
      if (shiftError) {
        console.log("[v0] Shifts insertion error:", shiftError)
        throw shiftError
      }

      if (data.interviewSlots.length > 0) {
        const availabilityData: any = {
          candidate_id: candidateId,
          first_name: data.firstName,
          last_name: data.lastName,
        }

        data.interviewSlots.forEach((slot, index) => {
          if (index < 8) {
            availabilityData[`interview_slot_${index + 1}`] = slot
          }
        })

        console.log("[v0] Inserting availability data:", availabilityData)

        const { error: availError } = await supabase
          .from("candidate_availability")
          .insert([availabilityData])
        if (availError) {
          console.log("[v0] Availability insertion error:", availError)
          throw availError
        }
      }

      const experienceData: any = {
        candidate_id: candidateId,
        first_name: data.firstName,
        last_name: data.lastName,
      }

      data.experiences.forEach((exp, index) => {
        if (index < 3 && (exp.role || exp.restaurant)) {
          const expNum = index + 1
          experienceData[`experience_${expNum}_role`] = exp.role || null
          experienceData[`experience_${expNum}_start_month`] =
            exp.startMonth || null
          experienceData[`experience_${expNum}_start_year`] = exp.startYear
            ? Number.parseInt(exp.startYear)
            : null
          experienceData[`experience_${expNum}_end_month`] =
            exp.endMonth || null
          experienceData[`experience_${expNum}_end_year`] = exp.endYear
            ? Number.parseInt(exp.endYear)
            : null
          experienceData[`experience_${expNum}_restaurant`] =
            exp.restaurant || null

          experienceData[`restaurant_${expNum}_place_id`] =
            exp.restaurantPlaceId || null
          experienceData[`restaurant_${expNum}_business_name`] =
            exp.restaurantName || exp.restaurant || null
          experienceData[`restaurant_${expNum}_address`] =
            exp.restaurantAddress || null
          experienceData[`restaurant_${expNum}_price_level`] =
            exp.restaurantPriceLevel || null
          experienceData[`restaurant_${expNum}_types`] =
            exp.restaurantTypes || null
          experienceData[`restaurant_${expNum}_rating`] =
            exp.restaurantRating || null
          experienceData[`restaurant_${expNum}_user_ratings_total`] =
            exp.restaurantUserRatingsTotal || null
        }
      })

      const hasExperience = data.experiences.some(
        (exp) => exp.role || exp.restaurant
      )
      if (hasExperience) {
        console.log("[v0] Inserting experience data:", experienceData)
        const { error: expError } = await supabase
          .from("candidate_experience")
          .insert([experienceData])
        if (expError) {
          console.log("[v0] Experience insertion error:", expError)
          throw expError
        }
      }

      console.log("[v0] Form submission completed successfully")
      router.push("/thank-you")
    } catch (error) {
      console.error("Error submitting questionnaire:", error)
      alert("Error submitting application. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <PersonalInfoPage
            data={data}
            onUpdate={(updates) => setData({ ...data, ...updates })}
            showErrors={showErrors}
            sessionId={sessionId}
          />
        )
      case 2:
        return (
          <VideoRecordingPage
            data={data}
            onUpdate={(updates) => setData({ ...data, ...updates })}
            onNextPage={goToNextPage}
          />
        )
      case 3:
        return (
          <BioSkillsPage
            data={data}
            onUpdate={(updates) => setData({ ...data, ...updates })}
          />
        )
      case 4:
        return (
          <ExperiencePage
            data={data}
            onUpdate={(updates) => setData({ ...data, ...updates })}
            sessionId={sessionId}
          />
        )
      case 5:
        return (
          <AvailabilityPage
            data={data}
            onUpdate={(updates) => setData({ ...data, ...updates })}
          />
        )
      default:
        return null
    }
  }

  const isCurrentPageValid = () => {
    switch (currentPage) {
      case 1:
        const phoneValid =
          data.phoneNumber && data.phoneNumber.replace(/\D/g, "").length === 10
        const emailValid =
          !data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
        return (
          data.firstName &&
          data.lastName &&
          phoneValid &&
          emailValid &&
          data.locationRoute &&
          data.locationLocality &&
          data.locationState &&
          data.locationPlaceId &&
          data.locationLat &&
          data.locationLng &&
          data.positionId
        )
      case 2:
        return data.video_url
      case 3:
        return data.bio && data.selectedSkills.length > 0
      case 4:
        const firstExp = data.experiences[0]
        return (
          firstExp.role &&
          firstExp.restaurant &&
          firstExp.startMonth &&
          firstExp.startYear
        )
      case 5:
        return (
          Object.values(data.shiftAvailability).some(Boolean) &&
          data.interviewSlots.length > 0
        )
      default:
        return false
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>
            Page {currentPage} of {totalPages}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        {renderCurrentPage()}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentPage === totalPages ? (
            <Button
              onClick={handleSubmit}
              disabled={!isCurrentPageValid() || isLoading}
            >
              {isLoading ? "Submitting..." : "Submit your Profile"}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!isCurrentPageValid()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
