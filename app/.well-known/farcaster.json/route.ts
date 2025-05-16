function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;

  return Response.json({
    accountAssociation: {
      header:
        "eyJmaWQiOjc5ODgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg1MUQ0NDZFOTNhMTcxZGQxMkY4NGI3NWE4RDFCNjgyNTVGN2MxRjgyIn0",
      payload: "eyJkb21haW4iOiJhcHAubWluaWdhbWVzLnN0dWRpbyJ9",
      signature:
        "MHhmYzUzMTM4YTVlN2JjOWY0ODgwZGQxOTQxYTAwNzBjYTMxZDhhNzRiNDI3NDIwNThhYWZjY2I4YTJlNDRjNTlkMmZmOGEzOTdjYzQwZTUzMDVlNjEwOWQxYWM2MGEyOWYxODRhNjYxMWU4MGM4ZDdmYjQ4YTM2ODcwZjhhMjUzYjFi",
    },
    frame: withValidProperties({
      version: "1",
      name: "Mini Games",
      subtitle: "Play Mini Games",
      description: "Play Mini Games",
      screenshotUrls: [],
      iconUrl: "https://app.minigames.studio/favicon.ico",
      splashImageUrl: "https://app.minigames.studio/splash.png",
      splashBackgroundColor: "#000000",
      homeUrl: URL,
      webhookUrl: `https://app.minigames.studio/api/webhook`,
      primaryCategory: "games",
      tags: [],
      heroImageUrl: "https://app.minigames.studio/hero.png",
      tagline: "Play Mini Games",
      ogTitle: "Mini Games",
      ogDescription: "Play Mini Games",
      ogImageUrl: "https://app.minigames.studio/og.png",
    }),
  });
}
