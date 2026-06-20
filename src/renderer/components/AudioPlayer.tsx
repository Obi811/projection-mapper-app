/**
 * AudioPlayer Component
 * 
 * Audio playback controls with waveform visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audio-service';
import type { AudioState } from '../../shared/types';

export const AudioPlayer: React.FC = () => {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    track: null,
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Subscribe to audio state changes
    const unsubscribe = audioService.subscribe(setState);
    
    // Start waveform animation
    startVisualization();
    
    return () => {
      unsubscribe();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      const waveform = audioService.getWaveformData();
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      
      const sliceWidth = width / waveform.length;
      let x = 0;
      
      for (let i = 0; i < waveform.length; i++) {
        const v = waveform[i] / 128.0;
        const y = (v * height) / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  const handleOpenFile = async () => {
    if (!window.electronAPI?.audio) return;
    
    const filePath = await window.electronAPI.audio.openFile();
    if (filePath) {
      await audioService.loadAudio(`file://${filePath}`);
    }
  };

  const handlePlayPause = () => {
    if (state.isPlaying) {
      audioService.pause();
    } else {
      audioService.play();
    }
  };

  const handleStop = () => {
    audioService.stop();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    audioService.seek(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    audioService.setVolume(volume);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Audio-Synchronisation</h3>
      
      {/* Waveform Visualization */}
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        style={styles.canvas}
      />
      
      {/* Playback Controls */}
      <div style={styles.controls}>
        <button onClick={handleOpenFile} style={styles.button}>
          📂 Datei öffnen
        </button>
        
        <div style={styles.playbackButtons}>
          <button onClick={handlePlayPause} style={styles.button} disabled={!state.track}>
            {state.isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={handleStop} style={styles.button} disabled={!state.track}>
            ⏹ Stop
          </button>
        </div>
      </div>
      
      {/* Timeline */}
      <div style={styles.timeline}>
        <span style={styles.timeLabel}>{formatTime(state.currentTime)}</span>
        <input
          type="range"
          min="0"
          max={state.duration || 0}
          value={state.currentTime}
          onChange={handleSeek}
          style={styles.slider}
          disabled={!state.track}
        />
        <span style={styles.timeLabel}>{formatTime(state.duration)}</span>
      </div>
      
      {/* Volume Control */}
      <div style={styles.volumeControl}>
        <span style={styles.label}>🔊 Lautstärke</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.volume}
          onChange={handleVolumeChange}
          style={styles.volumeSlider}
        />
        <span style={styles.label}>{Math.round(state.volume * 100)}%</span>
      </div>
      
      {/* Track Info */}
      {state.track && (
        <div style={styles.trackInfo}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Datei:</span>
            <span style={styles.infoValue}>{state.track.name}</span>
          </div>
          {state.track.bpm && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>BPM:</span>
              <span style={styles.infoValue}>{state.track.bpm}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    border: '1px solid #27272a',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  canvas: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#18181b',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playbackButtons: {
    display: 'flex',
    gap: 8,
  },
  button: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #3f3f46',
    backgroundColor: '#27272a',
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  timeline: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  timeLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontFamily: 'monospace',
    minWidth: 40,
  },
  slider: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    outline: 'none',
    background: '#3f3f46',
  },
  volumeControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  volumeSlider: {
    width: 120,
    height: 6,
    borderRadius: 3,
    outline: 'none',
    background: '#3f3f46',
  },
  label: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  trackInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    backgroundColor: '#27272a',
    borderRadius: 8,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  infoLabel: {
    color: '#71717a',
  },
  infoValue: {
    color: '#e4e4e7',
    fontWeight: 500,
  },
};
