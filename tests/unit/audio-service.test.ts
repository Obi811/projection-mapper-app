import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioService } from '@services/audio-service';

// Mock Web Audio API
const mockAudioContext = {
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
  })),
  createAnalyser: vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  })),
  decodeAudioData: vi.fn(() => Promise.resolve({ duration: 120 })),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
};

global.AudioContext = vi.fn(() => mockAudioContext) as any;
global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })
) as any;

describe('Audio Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize audio context', () => {
    audioService.init();
    expect(global.AudioContext).toHaveBeenCalled();
  });

  it('should load audio from URL', async () => {
    await audioService.loadAudio('test.mp3');
    expect(global.fetch).toHaveBeenCalledWith('test.mp3');
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
  });

  it('should return correct initial state', () => {
    const state = audioService.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
    expect(state.volume).toBe(1);
  });

  it('should subscribe to state changes', () => {
    const callback = vi.fn();
    const unsubscribe = audioService.subscribe(callback);
    
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should return empty waveform when not initialized', () => {
    const waveform = audioService.getWaveformData();
    expect(waveform).toBeInstanceOf(Uint8Array);
  });

  it('should return empty frequency data when not initialized', () => {
    const freq = audioService.getFrequencyData();
    expect(freq).toBeInstanceOf(Uint8Array);
  });
});
