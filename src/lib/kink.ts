import { Track } from "@/types/track";

export async function fetchPlaylist(): Promise<Track[]> {
    try {
        // Use a CORS proxy to fetch the Kink.nl playlist page
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://kink.nl/gedraaid/kink');
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch Kink.nl: ${response.statusText}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const tracks: Track[] = [];
        const h2Elements = doc.querySelectorAll('h2');

        h2Elements.forEach((h2) => {
            const artist = h2.textContent?.trim() || '';
            const nextElement = h2.nextElementSibling;
            const title = nextElement?.textContent?.trim() || '';

            // Filter out shows (time ranges)
            if (/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(title)) {
                return;
            }

            if (!title || !artist) return;
            if (artist.includes('Meld je aan') || artist.includes('Contact') || artist.includes('NaamTelefoonnummer')) return;
            // Filter out long text blocks that are likely not artists
            if (artist.length > 50 || title.length > 100) return;

            tracks.push({ artist, title });
        });

        // Limit to last 50 tracks
        const recentTracks = tracks.slice(0, 50);

        // Fetch Metadata from iTunes
        const tracksWithMetadata = await Promise.all(
            recentTracks.map(async (track) => {
                try {
                    const query = encodeURIComponent(`${track.artist} ${track.title}`);
                    const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);

                    if (itunesResponse.ok) {
                        const data = await itunesResponse.json();
                        if (data.results && data.results.length > 0) {
                            const result = data.results[0];
                            return {
                                ...track,
                                coverUrl: result.artworkUrl100?.replace('100x100', '600x600'),
                                previewUrl: result.previewUrl,
                                collectionName: result.collectionName,
                            };
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch metadata for ${track.artist} - ${track.title}`, e);
                }
                return track;
            })
        );

        return tracksWithMetadata;
    } catch (error) {
        console.error('Error scraping playlist:', error);
        return [];
    }
}
