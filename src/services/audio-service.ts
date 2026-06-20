/**
 * Audio Service
 * 
 * Manages audio playback, synchronization, and analysis using Web Audio API.
 * Provides timeline sync for projection mapping effects.
 */

import type { AudioTrack, AudioState, BeatMarker } from '../shared/types';

class AudioServiceClass {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPlaying: boolean = false;
  
  private listeners: Set<(state: AudioState) => void> = new Set();
  
  /**
   * Initialize Audio Context
   */
  init(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 2048;
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
  }
  
  /**
   * Load audio file from URL or path
   */
  async loadAudio(url: string): Promise<void> {
    this.init();
    
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.pauseTime = 0;
    this.notifyListeners();
  }
  
  /**
   * Play audio from current position
   */
  play(): void {
    if (!this.audioContext || !this.audioBuffer) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Stop previous source if exists
    if (this.sourceNode) {
      this.sourceNode.stop();
    }
    
    // Create new source
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode!);
    
    // Start from pause position
    const offset = this.pauseTime;
    this.sourceNode.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.isPlaying = true;
    
    // Handle end of track
    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pauseTime = 0;
        this.notifyListeners();
      }
    };
    
    this.notifyListeners();
  }
  
  /**
   * Pause audio playback
   */
  pause(): void {
    if (!this.audioContext || !this.sourceNode || !this.isPlaying) return;
    
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.sourceNode.stop();
    this.isPlaying = false;
    this.notifyListeners();
  }
  
  /**
   * Stop audio and reset to beginning
   */
  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
    }
    this.isPlaying = false;
    this.pauseTime = 0;
    this.startTime = 0;
    this.notifyListeners();
  }
  
  /**
   * Seek to specific time
   */
  seek(time: number): void {
    const wasPlaying = this.isPlaying;
    
    if (this.isPlaying) {
      this.pause();
    }
    
    this.pauseTime = Math.max(0, Math.min(time, this.getDuration()));
    
    if (wasPlaying) {
      this.play();
    } else {
      this.notifyListeners();
    }
  }
  
  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
      this.notifyListeners();
    }
  }
  
  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pauseTime;
  }
  
  /**
   * Get audio duration
   */
  getDuration(): number {
    return this.audioBuffer?.duration ?? 0;
  }
  
  /**
   * Get current audio state
   */
  getState(): AudioState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: this.gainNode?.gain.value ?? 1,
      track: null, // TODO: track metadata
    };
  }
  
  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
  
  /**
   * Get waveform data for visualization
   */
  getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    
    const dataArray = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: AudioState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state));
  }
  
  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.listeners.clear();
  }
}

export const audioService = new AudioServiceClass();
