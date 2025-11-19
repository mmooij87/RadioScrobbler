import { Track } from "@/types/track";

export interface RadioStation {
    id: string;
    name: string;
    color: string;
    logoPath: string;
    fetchPlaylist: () => Promise<Track[]>;
}

export async function fetchKinkPlaylist(): Promise<Track[]> {
    try {
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

            let playedAt = '';
            const prevElement = h2.previousElementSibling;
            if (prevElement && /^\d{2}:\d{2}$/.test(prevElement.textContent?.trim() || '')) {
                playedAt = prevElement.textContent?.trim() || '';
            }

            if (/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(title)) {
                return;
            }

            if (!title || !artist) return;
            if (artist.includes('Meld je aan') || artist.includes('Contact') || artist.includes('NaamTelefoonnummer')) return;
            if (artist.length > 50 || title.length > 100) return;

            tracks.push({ artist, title, playedAt });
        });

        const recentTracks = tracks.slice(0, 50);
        return await enrichWithMetadata(recentTracks);
    } catch (error) {
        console.error('Error scraping Kink playlist:', error);
        return [];
    }
}

export async function fetchSublimePlaylist(): Promise<Track[]> {
    try {
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://onlineradiobox.com/nl/sublime/playlist/?cs=nl.bangsajawa');
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch Sublime: ${response.statusText}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const tracks: Track[] = [];

        // Find all links that point to track pages
        const trackLinks = doc.querySelectorAll('a[href*="/track/"]');

        trackLinks.forEach((link) => {
            const fullText = link.textContent?.trim() || '';
            // Format is usually "Artist - Title"
            const parts = fullText.split(' - ');
            if (parts.length >= 2) {
                const artist = parts[0].trim();
                const title = parts.slice(1).join(' - ').trim();

                // Filter out empty or invalid entries
                if (artist && title && artist.length > 0 && title.length > 0) {
                    tracks.push({ artist, title });
                }
            }
        });

        const recentTracks = tracks.slice(0, 50);
        return await enrichWithMetadata(recentTracks);
    } catch (error) {
        console.error('Error scraping Sublime playlist:', error);
        return [];
    }
}

async function enrichWithMetadata(tracks: Track[]): Promise<Track[]> {
    const tracksWithMetadata = await Promise.all(
        tracks.map(async (track) => {
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
}

export const radioStations: RadioStation[] = [
    {
        id: 'kink',
        name: 'Kink',
        color: '#E30513',
        logoPath: '/kink-logo.png',
        fetchPlaylist: fetchKinkPlaylist,
    },
    {
        id: 'sublime',
        name: 'Sublime',
        color: '#FF6B00',
        logoPath: '/sublime-logo.png',
        fetchPlaylist: fetchSublimePlaylist,
    },
];
