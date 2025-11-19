import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export interface Track {
    artist: string;
    title: string;
    coverUrl?: string;
    previewUrl?: string;
    collectionName?: string;
}

export async function GET() {
    try {
        // 1. Fetch Kink.nl playlist page
        const response = await fetch('https://kink.nl/gedraaid/kink', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            next: { revalidate: 60 }, // Cache for 60 seconds
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Kink.nl: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const tracks: Track[] = [];

        // 2. Parse HTML
        // Based on the structure seen in the research:
        // <h2>Artist Name</h2>
        // <p>Song Title</p> (or just text after h2)
        // The chunk showed:
        // ## Stefan Koren
        // 15:00 - 18:00
        // ## Queens Of The Stone Age
        // The Lost Art of Keeping a Secret

        // We need to iterate over h2 elements and check the following content.
        // The structure seems to be a list of items.
        // Let's assume a container or just sequential elements.
        // In the chunk, it looked like a flat list of headers and text.

        // Let's try to find the container. Usually these are in a list or div.
        // Since I don't have the full DOM, I'll assume they are in a main container.
        // I'll select all 'h2' and look at the next sibling.

        $('h2').each((_, element) => {
            const artist = $(element).text().trim();

            // Get the next element's text (likely the song title)
            // We need to be careful about the structure.
            // If it's just text nodes, next() might not work if it's not an element.
            // But usually it's a <p> or <div>.
            // Let's try next element.
            let title = $(element).next().text().trim();

            // Filter out shows (time ranges)
            // Regex for "HH:MM - HH:MM"
            if (/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(title)) {
                return; // Skip shows
            }

            // Also skip if title is empty or looks like navigation
            if (!title || !artist) return;

            // Skip "Meld je aan..." and other footer links if they appear as h2
            if (artist.includes('Meld je aan') || artist.includes('Contact')) return;

            tracks.push({ artist, title });
        });

        // Limit to last 20 tracks to avoid hitting iTunes API too hard
        const recentTracks = tracks.slice(0, 20);

        // 3. Fetch Metadata from iTunes
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
                                coverUrl: result.artworkUrl100?.replace('100x100', '600x600'), // Get higher res
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

        return NextResponse.json({ tracks: tracksWithMetadata });
    } catch (error) {
        console.error('Error scraping playlist:', error);
        return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
    }
}
