"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Play, Pause, RefreshCw, Music, ChevronDown } from "lucide-react";
import { radioStations, RadioStation } from "@/lib/stations";
import { Track } from "@/types/track";

export default function Home() {
  const [selectedStation, setSelectedStation] = useState<RadioStation>(radioStations[0]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadPlaylist = async () => {
    setLoading(true);
    const data = await selectedStation.fetchPlaylist();
    setTracks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPlaylist();
    const interval = setInterval(loadPlaylist, 60000);
    return () => clearInterval(interval);
  }, [selectedStation]);

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

  const handleStationChange = (station: RadioStation) => {
    setSelectedStation(station);
    setShowDropdown(false);
    setPlayingUrl(null);
    audioRef.current?.pause();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#121212] to-[#0a0a0a] text-white font-sans">
      <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} />

      <header
        className="sticky top-0 z-10 shadow-lg border-b border-opacity-20"
        style={{
          background: `linear-gradient(to right, ${selectedStation.color}, ${selectedStation.color}dd)`,
          borderColor: selectedStation.color
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm min-w-[120px]"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-2xl" style={{ color: selectedStation.color }}>
                  {selectedStation.name[0]}
                </div>
                <span className="font-bold text-lg">{selectedStation.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute top-full mt-2 left-0 bg-[#1a1a1a] rounded-lg shadow-2xl border border-white/10 overflow-hidden min-w-[200px]">
                  {radioStations.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => handleStationChange(station)}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 ${selectedStation.id === station.id ? 'bg-white/5' : ''
                        }`}
                    >
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-black text-xl" style={{ color: station.color }}>
                        {station.name[0]}
                      </div>
                      <span className="text-sm font-medium">{station.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight">Playlist Scrobbler</h1>
              <p className="text-sm text-white/80">Now Playing on {selectedStation.name}</p>
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
                        <div
                          className="rounded-full p-3 shadow-lg"
                          style={{ backgroundColor: selectedStation.color }}
                        >
                          <Pause className="w-8 h-8 text-white fill-current" />
                        </div>
                      ) : (
                        <div
                          className="rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: selectedStation.color }}
                        >
                          <Play className="w-8 h-8 text-white fill-current ml-0.5" />
                        </div>
                      )}
                    </button>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`font-bold truncate text-base leading-tight flex-1 ${playingUrl === track.previewUrl ? '' : 'text-white'}`}
                      style={{ color: playingUrl === track.previewUrl ? selectedStation.color : undefined }}
                    >
                      {track.title}
                    </div>
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(`${track.artist} ${track.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      title="Open in Spotify"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                    </a>
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
