"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Play, Pause, RefreshCw, Music } from "lucide-react";
import { fetchPlaylist } from "@/lib/kink";
import { Track } from "@/types/track";

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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#121212] to-[#0a0a0a] text-white font-sans">
      <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} />

      <header className="sticky top-0 z-10 bg-gradient-to-r from-[#E30513] to-[#B00410] shadow-lg border-b border-red-600/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image
              src="/kink-logo.png"
              alt="Kink Radio"
              width={80}
              height={40}
              className="brightness-0 invert"
              unoptimized
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight">Playlist Scrobbler</h1>
              <p className="text-sm text-white/80">Now Playing on Kink.nl</p>
            </div>
          </div>
          <button
            onClick={loadPlaylist}
            disabled={loading}
            className="p-3 hover:bg-white/20 rounded-full transition-all disabled:opacity-50 backdrop-blur-sm"
            title="Refresh playlist"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {loading && tracks.length === 0 ? (
            // Skeletons
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 rounded-lg bg-white/5 animate-pulse">
                <div className="aspect-square w-full bg-white/10 rounded-md" />
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/10 rounded w-1/4" />
                </div>
              </div>
            ))
          ) : (
            tracks.map((track, index) => (
              <div
                key={`${track.artist}-${track.title}-${index}`}
                className="group flex flex-col gap-3 p-4 rounded-lg bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/5 transition-all backdrop-blur-sm border border-white/5 hover:border-white/10"
              >
                <div className="relative aspect-square w-full bg-gradient-to-br from-[#282828] to-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                  {track.coverUrl ? (
                    <Image
                      src={track.coverUrl}
                      alt={track.collectionName || "Album Art"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
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
                      className={`absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm ${playingUrl === track.previewUrl ? 'opacity-100 bg-black/70' : ''}`}
                    >
                      {playingUrl === track.previewUrl ? (
                        <div className="bg-[#E30513] rounded-full p-3 shadow-lg">
                          <Pause className="w-8 h-8 text-white fill-current" />
                        </div>
                      ) : (
                        <div className="bg-[#E30513] rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-white fill-current ml-0.5" />
                        </div>
                      )}
                    </button>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className={`font-bold truncate text-base leading-tight ${playingUrl === track.previewUrl ? 'text-[#E30513]' : 'text-white'}`}>
                    {track.title}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {track.artist}
                  </div>
                  {track.playedAt && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                      {track.playedAt}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
