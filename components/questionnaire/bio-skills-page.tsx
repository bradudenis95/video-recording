"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { QuestionnaireData } from "../questionnaire-form"

interface Skill {
  id: string
  category: string
  skill_name: string
}

interface BioSkillsPageProps {
  data: QuestionnaireData
  onUpdate: (updates: Partial<QuestionnaireData>) => void
}

export function BioSkillsPage({ data, onUpdate }: BioSkillsPageProps) {
  const [skills, setSkills] = useState<Record<string, Skill[]>>({})
  const supabase = createClient()

  useEffect(() => {
    const fetchSkills = async () => {
      const { data: skillsData } = await supabase
        .from("skills")
        .select(`
          id,
          name,
          skill_categories (
            name
          )
        `)
        .order("skill_categories(name), name")

      if (skillsData) {
        const groupedSkills = skillsData.reduce(
          (acc, skill) => {
            const category = skill.skill_categories?.name || "Other"
            if (!acc[category]) {
              acc[category] = []
            }
            acc[category].push({
              id: skill.id,
              category: category,
              skill_name: skill.name,
            })
            return acc
          },
          {} as Record<string, Skill[]>,
        )

        setSkills(groupedSkills)
      }
    }

    fetchSkills()
  }, [supabase])

  const handleSkillToggle = (skillName: string) => {
    const currentSkills = data.selectedSkills || []
    let updatedSkills

    if (currentSkills.includes(skillName)) {
      updatedSkills = currentSkills.filter((s) => s !== skillName)
    } else if (currentSkills.length < 8) {
      updatedSkills = [...currentSkills, skillName]
    } else {
      return // Max 8 skills
    }

    onUpdate({ selectedSkills: updatedSkills })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Tell us more about you</h2>

        <div className="space-y-8">
          <div>
            <Label htmlFor="bio" className="text-lg font-semibold mb-3 block">
              Brief Bio (max 250 characters) *
            </Label>
            <Textarea
              id="bio"
              value={data.bio}
              onChange={(e) => onUpdate({ bio: e.target.value })}
              placeholder="Example: Natural leader with 5+ years FOH experience. Prev. captain at Michelin steakhouse, trained 15+ new servers. Specializes in wine service and managing large parties."
              maxLength={250}
              className="min-h-[100px] placeholder:italic placeholder:text-xs sm:placeholder:text-sm border-2 border-gray-300 focus:border-emerald-500"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">{data.bio.length}/250 characters</p>
          </div>

          <div>
            <Label className="text-lg font-semibold mb-3 block">Top Skills (select up to 8) *</Label>
            <p className="text-sm text-gray-500 mb-6">Selected: {data.selectedSkills.length}/8</p>

            {Object.entries(skills).map(([category, categorySkills]) => (
              <div key={category} className="mb-8">
                <h3 className="font-bold text-base text-gray-800 mb-4 uppercase tracking-wide border-b border-gray-200 pb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categorySkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 border border-gray-200"
                    >
                      <Checkbox
                        id={skill.id}
                        checked={data.selectedSkills.includes(skill.skill_name)}
                        onCheckedChange={() => handleSkillToggle(skill.skill_name)}
                        disabled={!data.selectedSkills.includes(skill.skill_name) && data.selectedSkills.length >= 8}
                        className="w-5 h-5"
                      />
                      <Label htmlFor={skill.id} className="text-sm font-normal cursor-pointer flex-1">
                        {skill.skill_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {data.selectedSkills.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Selected Skills:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.selectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
