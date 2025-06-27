/**
 * Load an image from a URL and return it as a Buffer
 */
export async function loadImage(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error loading image:', error);
    throw error;
  }
}

/**
 * Load a Google Font and return it as a Buffer
 */
export async function loadGoogleFont(
  fontFamily: string,
  text: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): Promise<Buffer> {
  try {
    // First, get the CSS from Google Fonts
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;700&display=swap&text=${encodeURIComponent(text)}`;

    const cssResponse = await fetch(fontUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      },
    });

    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch font CSS: ${cssResponse.statusText}`);
    }

    const css = await cssResponse.text();

    // Extract the font URL from the CSS
    const fontUrlMatch = css.match(/url\(([^)]+)\)/);
    if (!fontUrlMatch) {
      throw new Error('Could not extract font URL from CSS');
    }

    const actualFontUrl = fontUrlMatch[1];

    // Download the actual font file
    const fontResponse = await fetch(actualFontUrl);
    if (!fontResponse.ok) {
      throw new Error(`Failed to fetch font file: ${fontResponse.statusText}`);
    }

    const arrayBuffer = await fontResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error loading Google Font:', error);
    // Return a fallback or throw
    throw error;
  }
}
