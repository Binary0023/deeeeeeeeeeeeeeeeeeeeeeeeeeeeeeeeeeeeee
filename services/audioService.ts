import { Theme } from '../types';

// Simple synth for game sounds
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const ctx = new AudioContext();

let globalVolume = 0.3;

export const setGlobalVolume = (vol: number) => {
  globalVolume = vol;
};

const playTone = (freq: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle', duration: number, volMultiplier: number = 1.0) => {
  if (globalVolume <= 0) return;
  if (ctx.state === 'suspended') ctx.resume();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  const finalVol = 0.1 * volMultiplier * globalVolume;

  gain.gain.setValueAtTime(finalVol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playMoveSound = (theme: Theme) => {
  // Variation based on theme
  const base = theme.soundConfig.baseFreq || 440;
  const pitch = base + (Math.random() * 50 - 25);
  playTone(pitch, theme.soundConfig.waveForm, 0.1, 0.5);
};

export const playWallSound = (theme: Theme) => {
  playTone(100, 'square', 0.1, 0.4);
};

export const playLevelCompleteSound = () => {
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'triangle', 0.4, 0.6), i * 100);
  });
};

export const playStartSound = () => {
   playTone(220, 'sawtooth', 0.6, 0.6);
};

export const playDeathSound = () => {
  playTone(150, 'sawtooth', 0.4, 0.8);
  setTimeout(() => playTone(100, 'square', 0.6, 0.8), 200);
};

export const playGlitchSound = () => {
  if (globalVolume <= 0) return;
  if (ctx.state === 'suspended') ctx.resume();
  
  const bufferSize = ctx.sampleRate * 0.3; 
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * globalVolume;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.2;
  noise.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
};