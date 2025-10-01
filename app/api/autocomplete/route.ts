import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get("input")

  console.log("[v0] API route called with input:", input)

  if (!input) {
    return NextResponse.json({ error: "Input parameter is required" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  console.log("[v0] API key exists:", !!apiKey)

  if (!apiKey) {
    console.log("[v0] Google Places API key not configured")
    return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 })
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(input)}&` +
      `types=establishment&` +
      `key=${apiKey}`

    console.log("[v0] Making request to Google Places API")

    const response = await fetch(url)

    console.log("[v0] Google API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Google API error response:", errorText)
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()

    console.log("[v0] Google API response status:", data.status)
    console.log("[v0] Number of predictions:", data.predictions?.length || 0)

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.log("[v0] Google API returned error status:", data.status, data.error_message)
      throw new Error(`Google Places API status: ${data.status}`)
    }

    return NextResponse.json({ predictions: data.predictions || [] })
  } catch (error) {
    console.error("[v0] Places autocomplete error:", error)
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
  }
}
