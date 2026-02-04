import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Music } from 'lucide-react';

type PlaybackState = 'stopped' | 'playing' | 'paused';

// Free lofi radio stream
const STREAM_URL = 'https://play.streamafrica.net/lofiradio';

export function MusicPlayer() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(STREAM_URL);
    audioRef.current.volume = 0.5;

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

  const isPlaying = playbackState === 'playing';
  const isPaused = playbackState === 'paused';

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
      {playbackState !== 'stopped' && (
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
    </div>
  );
}
