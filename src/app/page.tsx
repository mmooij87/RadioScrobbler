"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Play, Pause, RefreshCw, Music } from "lucide-react";
import { fetchPlaylist } from "@/lib/kink";
import { Track } from "@/app/api/playlist/route";

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadPlaylist = async () => {
    setLoading(true);
    const data = await fetchPlaylist();
    setTracks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPlaylist();
    // Refresh every minute
    const interval = setInterval(loadPlaylist, 60000);
    return () => clearInterval(interval);
  }, []);

  const togglePlay = (url: string) => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
      setPlayingUrl(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} />

      <header className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm border-b border-white/10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-purple-700 rounded-full flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Kink Scrobbler</h1>
        </div>
        <button
          onClick={loadPlaylist}
          disabled={loading}
          className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {loading && tracks.length === 0 ? (
            // Skeletons
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 rounded-md bg-white/5 animate-pulse">
                <div className="aspect-square w-full bg-white/10 rounded-md" />
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : (
            tracks.map((track, index) => (
              <div
                key={`${track.artist}-${track.title}-${index}`}
                className="group flex flex-col gap-3 p-4 rounded-md hover:bg-white/10 transition-colors"
              >
                <div className="relative aspect-square w-full bg-[#282828] rounded-md overflow-hidden shadow-lg">
                  {track.coverUrl ? (
                    <Image
                      src={track.coverUrl}
                      alt={track.collectionName || "Album Art"}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  {track.previewUrl && (
                    <button
                      onClick={() => togglePlay(track.previewUrl!)}
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${playingUrl === track.previewUrl ? 'opacity-100 bg-black/60' : ''}`}
                    >
                      {playingUrl === track.previewUrl ? (
                        <Pause className="w-12 h-12 text-white fill-current" />
                      ) : (
                        <Play className="w-12 h-12 text-white fill-current" />
                      )}
                    </button>
                  )}
                </div>

                <div className="min-w-0">
                  <div className={`font-bold truncate text-lg ${playingUrl === track.previewUrl ? 'text-green-500' : 'text-white'}`}>
                    {track.title}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {track.artist}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
