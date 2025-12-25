import React from 'react';
import { Difficulty } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  volume: number;
  setVolume: (v: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, difficulty, setDifficulty, volume, setVolume
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur">
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-600 max-w-sm w-full shadow-2xl animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">SYSTEM SETTINGS</h2>
        
        <div className="space-y-6">
          {/* Difficulty */}
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">DIFFICULTY</label>
            <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-2 text-sm font-bold rounded transition-colors ${
                    difficulty === level 
                      ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 h-8">
              {difficulty === 'EASY' && "No enemies. Slower speed."}
              {difficulty === 'NORMAL' && "Standard experience. Balanced."}
              {difficulty === 'HARD' && "Aggressive enemies. Frequent glitches."}
            </p>
          </div>

          {/* Volume */}
          <div>
             <label className="block text-gray-400 text-sm font-bold mb-2">AUDIO VOLUME: {Math.round(volume * 100)}%</label>
             <input 
               type="range" 
               min="0" 
               max="1" 
               step="0.1"
               value={volume}
               onChange={(e) => setVolume(parseFloat(e.target.value))}
               className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
             />
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-transform hover:scale-105"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;