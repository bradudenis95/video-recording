import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get("input")

  if (!input) {
    return NextResponse.json({ error: "Input parameter is required" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 })
  }

  try {
    // Use Google Places Autocomplete API with restaurant type filter
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(input)}&` +
        `types=restaurant&` +
        `key=${apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API status: ${data.status}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Places autocomplete error:", error)
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
  }
}
