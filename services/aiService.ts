import { GoogleGenAI, Type } from "@google/genai";
import { Theme } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEFAULT_THEME: Theme = {
  name: "The Void",
  flavorText: "Silence echoes in the endless dark.",
  colors: {
    background: "#111827",
    walls: "#374151",
    player: "#3b82f6",
    path: "#1f2937",
    finish: "#10b981",
    enemy: "#ef4444",
    obstacle: "#f59e0b",
  },
  darknessMode: false,
  soundConfig: {
    waveForm: 'sine',
    baseFreq: 440,
  }
};

export const generateLevelTheme = async (level: number): Promise<Theme> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a creative visual and audio theme for Level ${level} of an abstract maze game.
      - Colors should be high contrast.
      - "soundConfig" determines the synth sound. 'sine' for calm, 'square'/'sawtooth' for harsh/digital/intense.
      - "baseFreq" is the starting pitch for movement sounds (range 200-800).
      - "darknessMode" enables a fog of war effect.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            flavorText: { type: Type.STRING },
            colors: {
              type: Type.OBJECT,
              properties: {
                background: { type: Type.STRING },
                walls: { type: Type.STRING },
                player: { type: Type.STRING },
                path: { type: Type.STRING },
                finish: { type: Type.STRING },
                enemy: { type: Type.STRING },
                obstacle: { type: Type.STRING },
              },
              required: ["background", "walls", "player", "path", "finish", "enemy", "obstacle"]
            },
            darknessMode: { type: Type.BOOLEAN },
            soundConfig: {
              type: Type.OBJECT,
              properties: {
                waveForm: { type: Type.STRING, enum: ['sine', 'square', 'sawtooth', 'triangle'] },
                baseFreq: { type: Type.NUMBER }
              },
              required: ["waveForm", "baseFreq"]
            }
          },
          required: ["name", "flavorText", "colors", "darknessMode", "soundConfig"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return DEFAULT_THEME;
    
    return JSON.parse(jsonText) as Theme;

  } catch (error) {
    console.warn("AI Theme generation failed, using default.", error);
    return DEFAULT_THEME;
  }
};