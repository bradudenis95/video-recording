import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/line%20cook.jpg-bThNndDP3dEauB0YPOeZA2ONGq5dfd.jpeg')`,
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 min-h-screen flex items-start justify-center pt-20 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 text-balance leading-tight text-center">
              <span className="text-white">Served</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-6 text-pretty max-w-3xl mx-auto leading-relaxed text-center">
              Welcome to the <span className="font-bold">Served app</span>, better hiring
              <br />
              for the Restaurant Industry
            </p>
          </div>

          <div className="mt-16">
            <Card className="max-w-sm mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="flex flex-col items-center justify-center py-2 px-6">
                <Link href="/questionnaire" className="w-full max-w-sm">
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg shadow-lg rounded-xl"
                  >
                    Build your Profile
                  </Button>
                </Link>
                <p className="text-sm text-gray-600 text-center mt-3 leading-relaxed max-w-sm">Takes ~10 minutes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
