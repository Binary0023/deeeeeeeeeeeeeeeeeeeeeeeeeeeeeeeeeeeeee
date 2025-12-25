import React from 'react';
import { GameState, Theme } from '../types';

interface GameOverlayProps {
  gameState: GameState;
  level: number;
  score: number;
  theme: Theme;
  onStart: () => void;
  onRestart: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ 
  gameState, 
  level, 
  score, 
  theme, 
  onStart, 
  onRestart 
}) => {
  if (gameState === 'PLAYING') return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
      <div className="max-w-md w-full animate-fade-in">
        
        {gameState === 'START' && (
          <div className="space-y-6">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              INFINITE<br/>A-MAZE
            </h1>
            <p className="text-gray-400 text-lg">Swipe or use Arrow Keys to survive the endless labyrinth.</p>
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              ENTER THE MAZE
            </button>
          </div>
        )}

        {gameState === 'LEVEL_TRANSITION' && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">LEVEL {level} COMPLETE</h2>
            <div className="h-1 w-32 bg-gray-700 mx-auto rounded-full overflow-hidden">
               <div className="h-full bg-emerald-400 animate-[loading_1s_ease-in-out_infinite]" style={{width: '100%'}}></div>
            </div>
            <div className="py-6 border border-gray-700 rounded-xl bg-gray-900/50">
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">ENTERING</p>
              <h3 className="text-2xl font-bold" style={{ color: theme.colors.player }}>
                {theme.name}
              </h3>
              <p className="text-gray-400 italic mt-2 px-4">"{theme.flavorText}"</p>
              {theme.darknessMode && (
                <div className="mt-4 inline-block px-3 py-1 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-xs font-bold">
                  WARNING: VISIBILITY LOW
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-red-500">GAME OVER</h2>
            <div className="text-2xl text-white">
              Level Reached: <span className="font-mono font-bold text-yellow-400">{level}</span>
            </div>
             <div className="text-xl text-gray-400">
              Score: <span className="font-mono">{score}</span>
            </div>
            <button 
              onClick={onRestart}
              className="mt-8 px-8 py-3 border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white hover:text-black transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOverlay;