"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import type { QuestionnaireData } from "../questionnaire-form"

interface AvailabilityPageProps {
  data: QuestionnaireData
  onUpdate: (updates: Partial<QuestionnaireData>) => void
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const timeSlots = [
  "9:00 AM",
  "9:15 AM",
  "9:30 AM",
  "9:45 AM",
  "10:00 AM",
  "10:15 AM",
  "10:30 AM",
  "10:45 AM",
  "11:00 AM",
  "11:15 AM",
  "11:30 AM",
  "11:45 AM",
  "12:00 PM",
  "12:15 PM",
  "12:30 PM",
  "12:45 PM",
  "1:00 PM",
  "1:15 PM",
  "1:30 PM",
  "1:45 PM",
  "2:00 PM",
  "2:15 PM",
  "2:30 PM",
  "2:45 PM",
  "3:00 PM",
  "3:15 PM",
  "3:30 PM",
  "3:45 PM",
  "4:00 PM",
  "4:15 PM",
  "4:30 PM",
  "4:45 PM",
  "5:00 PM",
  "5:15 PM",
  "5:30 PM",
  "5:45 PM",
]

export function AvailabilityPage({ data, onUpdate }: AvailabilityPageProps) {
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleShiftAvailabilityChange = (day: string, shift: string, checked: boolean) => {
    const key = `${day}-${shift}`
    const updatedAvailability = {
      ...data.shiftAvailability,
      [key]: checked,
    }

    if (!checked) {
      delete updatedAvailability[key]
    }

    onUpdate({ shiftAvailability: updatedAvailability })
  }

  const handleInterviewSlotAdd = () => {
    if (!selectedDay || !selectedTime) return

    const newSlot = `${selectedDay} at ${selectedTime}`

    // Check if slot already exists
    if (data.interviewSlots.includes(newSlot)) {
      return
    }

    // Check if we've reached the limit
    if (data.interviewSlots.length >= 8) {
      return
    }

    // Check for overlapping slots (15-minute interviews)
    const timeIndex = timeSlots.indexOf(selectedTime)
    if (timeIndex === -1) return

    const overlappingSlots = data.interviewSlots.filter((slot) => {
      const [slotDay, , slotTime] = slot.split(" ")
      if (slotDay !== selectedDay) return false

      const slotTimeIndex = timeSlots.indexOf(slotTime)
      if (slotTimeIndex === -1) return false

      // Check if slots overlap (within 15 minutes of each other)
      return Math.abs(timeIndex - slotTimeIndex) < 1
    })

    if (overlappingSlots.length > 0) {
      return
    }

    onUpdate({ interviewSlots: [...data.interviewSlots, newSlot] })

    // Reset selections after adding
    setSelectedDay("")
    setSelectedTime("")
  }

  const handleInterviewSlotRemove = (slot: string) => {
    onUpdate({
      interviewSlots: data.interviewSlots.filter((s) => s !== slot),
    })
  }

  const wouldOverlap = () => {
    if (!selectedDay || !selectedTime) return false

    const timeIndex = timeSlots.indexOf(selectedTime)
    if (timeIndex === -1) return false

    return data.interviewSlots.some((slot) => {
      const [slotDay, , slotTime] = slot.split(" ")
      if (slotDay !== selectedDay) return false

      const slotTimeIndex = timeSlots.indexOf(slotTime)
      if (slotTimeIndex === -1) return false

      return Math.abs(timeIndex - slotTimeIndex) < 1
    })
  }

  const canAddSlot =
    selectedDay &&
    selectedTime &&
    !data.interviewSlots.includes(`${selectedDay} at ${selectedTime}`) &&
    data.interviewSlots.length < 8 &&
    !wouldOverlap()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Availability</h2>

        {/* Shift Availability */}
        <Card className="mb-6 border-2 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Shift Availability *</CardTitle>
            <p className="text-sm text-muted-foreground">Select the shifts you are available to work</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {daysOfWeek.map((day) => (
                <div key={day} className="space-y-1">
                  <Label className="font-medium text-sm">{day}</Label>
                  <div className="space-y-1 pl-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${day}-lunch`}
                        checked={data.shiftAvailability[`${day}-lunch`] || false}
                        onCheckedChange={(checked) => handleShiftAvailabilityChange(day, "lunch", checked as boolean)}
                        className="border-2 border-gray-400 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <Label htmlFor={`${day}-lunch`} className="text-sm">
                        Lunch
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${day}-dinner`}
                        checked={data.shiftAvailability[`${day}-dinner`] || false}
                        onCheckedChange={(checked) => handleShiftAvailabilityChange(day, "dinner", checked as boolean)}
                        className="border-2 border-gray-400 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <Label htmlFor={`${day}-dinner`} className="text-sm">
                        Dinner
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interview Availability */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Interview Availability *</CardTitle>
            <p className="text-sm text-muted-foreground">
              Please choose a few time slots when you'd generally be available to take a quick phone interview from an
              interested employer
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="interview-day">Day</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger id="interview-day">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor="interview-time">Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger id="interview-time">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleInterviewSlotAdd} disabled={!canAddSlot} size="sm" className="px-3">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            {selectedDay && selectedTime && wouldOverlap() && (
              <p className="text-sm text-destructive">This time slot overlaps with an existing selection.</p>
            )}

            {data.interviewSlots.length >= 8 && (
              <p className="text-sm text-muted-foreground">Maximum of 8 slots reached.</p>
            )}

            <p className="text-sm text-muted-foreground">Selected slots: {data.interviewSlots.length}/8</p>

            {data.interviewSlots.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Interview Times:</Label>
                <div className="flex flex-wrap gap-2">
                  {data.interviewSlots.map((slot, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {slot}
                      <button
                        onClick={() => handleInterviewSlotRemove(slot)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AvailabilityPage
