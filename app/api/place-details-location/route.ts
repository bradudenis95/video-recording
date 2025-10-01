import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get("place_id")

  if (!placeId) {
    return NextResponse.json({ error: "place_id parameter is required" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.error("[v0] Google Places API key not configured")
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    console.log("[v0] Fetching place details for:", placeId)

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=address_components,geometry,formatted_address&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    console.log("[v0] Google Places Details API response status:", response.status)

    if (!response.ok) {
      console.error("[v0] Google Places Details API error:", data)
      return NextResponse.json({ error: "Failed to fetch place details" }, { status: 500 })
    }

    const result = data.result
    if (!result) {
      return NextResponse.json({ error: "No place details found" }, { status: 404 })
    }

    // Extract structured address components
    const addressComponents = result.address_components || []
    let route = ""
    let locality = ""
    let administrativeAreaLevel1 = ""

    addressComponents.forEach((component: any) => {
      const types = component.types
      if (types.includes("route")) {
        route = component.long_name
      } else if (types.includes("locality")) {
        locality = component.long_name
      } else if (types.includes("administrative_area_level_1")) {
        administrativeAreaLevel1 = component.short_name
      }
    })

    // Extract coordinates
    const geometry = result.geometry
    const lat = geometry?.location?.lat
    const lng = geometry?.location?.lng

    console.log("[v0] Extracted location data:", { route, locality, administrativeAreaLevel1, lat, lng })

    return NextResponse.json({
      route,
      locality,
      administrative_area_level_1: administrativeAreaLevel1,
      place_id: placeId,
      lat,
      lng,
      formatted_address: result.formatted_address,
    })
  } catch (error) {
    console.error("[v0] Place details error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
