import { QuestionnaireForm } from "@/components/questionnaire-form"

export default function QuestionnairePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <QuestionnaireForm />
        </div>
      </div>
    </div>
  )
}
