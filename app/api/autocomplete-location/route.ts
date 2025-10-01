import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get("input")

  if (!input) {
    return NextResponse.json({ error: "Input parameter is required" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.error("[v0] Google Places API key not configured")
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    console.log("[v0] Making location autocomplete request for:", input)

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=geocode&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    console.log("[v0] Google Places API response status:", response.status)

    if (!response.ok) {
      console.error("[v0] Google Places API error:", data)
      return NextResponse.json({ error: "Failed to fetch autocomplete suggestions" }, { status: 500 })
    }

    console.log("[v0] Returning", data.predictions?.length || 0, "location predictions")

    return NextResponse.json({
      predictions: data.predictions || [],
    })
  } catch (error) {
    console.error("[v0] Location autocomplete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
