export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    console.log("[v0] API Key check:", apiKey ? "Key exists" : "Key missing")
    console.log("[v0] Key length:", apiKey?.length || 0)

    if (!apiKey) {
      return Response.json(
        {
          error: "GOOGLE_PLACES_API_KEY environment variable not set",
          hasKey: false,
        },
        { status: 500 },
      )
    }

    // Test a simple Places API call
    const testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=${apiKey}`
    console.log("[v0] Testing Google Places API with URL:", testUrl.replace(apiKey, "HIDDEN_KEY"))

    const response = await fetch(testUrl)
    const data = await response.json()

    console.log("[v0] Google API response status:", response.status)
    console.log("[v0] Google API response:", data)

    return Response.json({
      hasKey: true,
      keyLength: apiKey.length,
      googleApiStatus: response.status,
      googleApiResponse: data,
    })
  } catch (error) {
    console.error("[v0] Test endpoint error:", error)
    return Response.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
