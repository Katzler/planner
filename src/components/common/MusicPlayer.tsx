import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Music, Volume2, VolumeX } from 'lucide-react';

type PlaybackState = 'stopped' | 'playing' | 'paused';

// Free lofi radio stream
const STREAM_URL = 'https://play.streamafrica.net/lofiradio';

export function MusicPlayer() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(STREAM_URL);
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleError = () => {
      setHasError(true);
      setPlaybackState('stopped');
    };

    const handlePlaying = () => {
      setHasError(false);
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('playing', handlePlaying);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handlePlay = async () => {
    if (!audioRef.current) return;

    try {
      setHasError(false);
      if (playbackState === 'stopped') {
        // Reload stream when starting from stopped state
        audioRef.current.src = STREAM_URL;
        audioRef.current.load();
      }
      await audioRef.current.play();
      setPlaybackState('playing');
    } catch (err) {
      setHasError(true);
      setPlaybackState('stopped');
    }
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setPlaybackState('paused');
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = '';
    setPlaybackState('stopped');
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleVolumeHover = () => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    setShowVolumeSlider(true);
  };

  const handleVolumeLeave = () => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 300);
  };

  const isPlaying = playbackState === 'playing';
  const isPaused = playbackState === 'paused';
  const isActive = playbackState !== 'stopped';

  const buttonBaseStyle = {
    padding: '6px',
    borderRadius: '9999px',
    transition: 'all 150ms ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div
      className="flex items-center gap-1 px-2 py-1"
      style={{
        background: isPlaying ? 'var(--accent-bg)' : 'var(--bg-card)',
        borderRadius: 'var(--border-radius-md)',
        border: `1px solid ${isPlaying ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
      }}
      title={hasError ? 'Stream unavailable' : 'Lofi Radio'}
    >
      {/* Music icon indicator */}
      <Music
        size={14}
        style={{
          color: hasError ? 'var(--status-danger)' : isPlaying ? 'var(--accent-primary)' : 'var(--text-muted)',
        }}
        className={isPlaying ? 'animate-pulse' : ''}
      />

      {/* Play/Pause button */}
      {isPlaying ? (
        <button
          onClick={handlePause}
          style={{
            ...buttonBaseStyle,
            color: 'var(--accent-primary)',
          }}
          aria-label="Pause music"
        >
          <Pause size={14} />
        </button>
      ) : (
        <button
          onClick={handlePlay}
          style={{
            ...buttonBaseStyle,
            color: isPaused ? 'var(--accent-primary)' : 'var(--text-secondary)',
          }}
          aria-label="Play music"
        >
          <Play size={14} />
        </button>
      )}

      {/* Stop button - only show when not stopped */}
      {isActive && (
        <button
          onClick={handleStop}
          style={{
            ...buttonBaseStyle,
            color: 'var(--text-muted)',
          }}
          aria-label="Stop music"
        >
          <Square size={12} />
        </button>
      )}

      {/* Volume control - only show when active */}
      {isActive && (
        <div
          className="relative flex items-center"
          onMouseEnter={handleVolumeHover}
          onMouseLeave={handleVolumeLeave}
        >
          <button
            onClick={handleMuteToggle}
            style={{
              ...buttonBaseStyle,
              color: isMuted ? 'var(--status-danger)' : 'var(--text-secondary)',
            }}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Volume slider popup */}
          {showVolumeSlider && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 flex flex-col items-center"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 50,
              }}
              onMouseEnter={handleVolumeHover}
              onMouseLeave={handleVolumeLeave}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="volume-slider"
                style={{
                  width: '80px',
                  height: '4px',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: `linear-gradient(to right, var(--accent-primary) ${(isMuted ? 0 : volume) * 100}%, var(--border-secondary) ${(isMuted ? 0 : volume) * 100}%)`,
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
                aria-label="Volume"
              />
              <span
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
