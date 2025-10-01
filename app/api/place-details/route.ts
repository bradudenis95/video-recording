import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get("place_id")

  if (!placeId) {
    return NextResponse.json({ error: "place_id parameter is required" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 })
  }

  try {
    // Fetch place details with specific fields
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${encodeURIComponent(placeId)}&` +
        `fields=place_id,name,formatted_address,price_level,types,rating,user_ratings_total&` +
        `key=${apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      throw new Error(`Google Places API status: ${data.status}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Place details error:", error)
    return NextResponse.json({ error: "Failed to fetch place details" }, { status: 500 })
  }
}
