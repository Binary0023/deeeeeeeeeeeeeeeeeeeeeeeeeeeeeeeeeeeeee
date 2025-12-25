import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateMaze, canMove, generateEntities } from './services/mazeUtils';
import { generateLevelTheme } from './services/aiService';
import { playMoveSound, playWallSound, playLevelCompleteSound, playStartSound, playGlitchSound, setGlobalVolume, playDeathSound } from './services/audioService';
import { useSwipe } from './hooks/useSwipe';
import MazeRenderer from './components/MazeRenderer';
import GameOverlay from './components/GameOverlay';
import SettingsModal from './components/SettingsModal';
import { Direction, GameState, MazeGrid, Position, Theme, GlitchType, Difficulty, Enemy, Obstacle } from './types';

// Constants
const INITIAL_SIZE = 15; 

const DEFAULT_THEME: Theme = {
  name: "Training Grounds",
  flavorText: "The journey begins with a single step.",
  colors: {
    background: "#1e293b",
    walls: "#64748b",
    player: "#38bdf8",
    path: "#334155",
    finish: "#4ade80",
    enemy: "#ef4444",
    obstacle: "#f59e0b",
  },
  darknessMode: false,
  soundConfig: { waveForm: 'sine', baseFreq: 440 }
};

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>('START');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  // Maze State
  const [grid, setGrid] = useState<MazeGrid>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [trail, setTrail] = useState<Position[]>([]);
  const [exitPos, setExitPos] = useState<Position>({ x: 0, y: 0 });
  const [mazeSize, setMazeSize] = useState<{ w: number; h: number }>({ w: INITIAL_SIZE, h: INITIAL_SIZE });
  
  // Entities
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // Glitch State
  const [activeGlitch, setActiveGlitch] = useState<GlitchType>('NONE');

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_THEME);
  const [nextTheme, setNextTheme] = useState<Theme | null>(null);

  // Refs for canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(20);

  // Audio Init
  useEffect(() => {
    setGlobalVolume(volume);
  }, [volume]);

  // Responsive Sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const maxW = clientWidth - 32; 
        const maxH = clientHeight - 160; 
        const cellW = Math.floor(maxW / mazeSize.w);
        const cellH = Math.floor(maxH / mazeSize.h);
        setCellSize(Math.min(cellW, cellH, 35)); 
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [mazeSize]);

  // Enemy AI Loop
  useEffect(() => {
    if (gameState !== 'PLAYING' || difficulty === 'EASY' || enemies.length === 0) return;

    // Movement speed varies by difficulty
    const speed = difficulty === 'HARD' ? 800 : 1500;

    const moveEnemies = setInterval(() => {
      setEnemies(prevEnemies => {
        return prevEnemies.map(enemy => {
          // Simple random movement logic
          const directions: Position[] = [
             { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
          ];
          const validMoves: Position[] = [];
          
          directions.forEach(d => {
            const nextPos = { x: enemy.x + d.x, y: enemy.y + d.y };
            // Simple boundary check - enemies can walk through walls in this version to be "ghostly" glitches, 
            // OR use mazeUtils.canMove. Let's make them walk through walls to be scarier/easier to code?
            // User requested "Random enemies". Let's respect walls for fairness.
            let dirStr: 'up'|'down'|'left'|'right' = 'up';
            if (d.y === -1) dirStr = 'up';
            if (d.y === 1) dirStr = 'down';
            if (d.x === -1) dirStr = 'left';
            if (d.x === 1) dirStr = 'right';

            if (canMove({x: enemy.x, y: enemy.y}, dirStr, grid)) {
                validMoves.push(nextPos);
            }
          });

          if (validMoves.length > 0) {
            // Bias towards player slightly in HARD mode
            if (difficulty === 'HARD' && Math.random() > 0.5) {
                // Find move minimizing distance to player
                validMoves.sort((a,b) => {
                   const distA = Math.abs(a.x - playerPos.x) + Math.abs(a.y - playerPos.y);
                   const distB = Math.abs(b.x - playerPos.x) + Math.abs(b.y - playerPos.y);
                   return distA - distB;
                });
                return { ...enemy, ...validMoves[0] };
            }
            // Random move
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            return { ...enemy, ...move };
          }
          return enemy;
        });
      });
    }, speed);

    return () => clearInterval(moveEnemies);
  }, [gameState, difficulty, grid, playerPos]);

  // Collision Detection (Tick-based for enemies walking into player)
  useEffect(() => {
     if (gameState !== 'PLAYING') return;

     // Check Enemy Collision
     const hitEnemy = enemies.some(e => e.x === playerPos.x && e.y === playerPos.y);
     if (hitEnemy) {
        handleGameOver();
     }
  }, [playerPos, enemies, gameState]);

  // Glitch Logic Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      setActiveGlitch('NONE');
      return;
    }

    // Determine glitch frequency
    let baseTime = 15000;
    if (difficulty === 'HARD') baseTime = 8000;
    if (difficulty === 'EASY') baseTime = 25000;

    const minTime = Math.max(3000, baseTime - (level * 200)); 
    const randomTime = Math.random() * 5000 + minTime;

    const timeout = setTimeout(() => {
       triggerGlitch();
    }, randomTime);

    return () => clearTimeout(timeout);
  }, [gameState, level, activeGlitch, difficulty]); 

  const triggerGlitch = () => {
     if (gameState !== 'PLAYING') return;
     
     const types: GlitchType[] = ['INVERT_CONTROLS', 'MOVE_EXIT', 'BLACKOUT', 'REALITY_FLUX'];
     const selected = types[Math.floor(Math.random() * types.length)];
     
     setActiveGlitch(selected);
     playGlitchSound();

     if (selected === 'MOVE_EXIT') {
        let newX = Math.floor(Math.random() * mazeSize.w);
        let newY = Math.floor(Math.random() * mazeSize.h);
        while (newX === playerPos.x && newY === playerPos.y) {
           newX = Math.floor(Math.random() * mazeSize.w);
           newY = Math.floor(Math.random() * mazeSize.h);
        }
        setExitPos({ x: newX, y: newY });
        setTimeout(() => setActiveGlitch('NONE'), 1500);
     } 
     else if (selected === 'REALITY_FLUX') {
       // Regenerate the grid walls but keep dimensions
       // This is aggressive, maybe just a partial Regen?
       // For safety, let's just re-run generation. It might trap the player, but that's a "Glitch".
       // To be fair, let's only do it if not easy.
       if (difficulty !== 'EASY') {
          const newGrid = generateMaze(mazeSize.w, mazeSize.h);
          // Preserve visited status? No, fresh maze.
          setGrid(newGrid);
          setTrail([]); // Clear trail as it doesn't match
       }
       setTimeout(() => setActiveGlitch('NONE'), 1000);
     }
     else {
        setTimeout(() => setActiveGlitch('NONE'), 4000);
     }
  };

  // Movement Logic
  const movePlayer = useCallback((direction: Direction) => {
    if (gameState !== 'PLAYING') return;

    let effectiveDirection = direction;

    if (activeGlitch === 'INVERT_CONTROLS') {
       switch(direction) {
          case Direction.UP: effectiveDirection = Direction.DOWN; break;
          case Direction.DOWN: effectiveDirection = Direction.UP; break;
          case Direction.LEFT: effectiveDirection = Direction.RIGHT; break;
          case Direction.RIGHT: effectiveDirection = Direction.LEFT; break;
       }
    }

    setPlayerPos((prev) => {
      let dx = 0;
      let dy = 0;
      let dirStr: 'up' | 'down' | 'left' | 'right' = 'up';

      switch (effectiveDirection) {
        case Direction.UP: dy = -1; dirStr = 'up'; break;
        case Direction.DOWN: dy = 1; dirStr = 'down'; break;
        case Direction.LEFT: dx = -1; dirStr = 'left'; break;
        case Direction.RIGHT: dx = 1; dirStr = 'right'; break;
      }

      if (canMove(prev, dirStr, grid)) {
        const newPos = { x: prev.x + dx, y: prev.y + dy };
        
        // Obstacle Check
        const hitObstacle = obstacles.find(o => o.x === newPos.x && o.y === newPos.y);
        if (hitObstacle) {
           playGlitchSound();
           // Remove obstacle
           setObstacles(obs => obs.filter(o => o.id !== hitObstacle.id));
           // Penalty
           setScore(s => Math.max(0, s - 200));
           // Screen shake glitch briefly
           setActiveGlitch('REALITY_FLUX');
           setTimeout(() => setActiveGlitch('NONE'), 300);
        }

        playMoveSound(currentTheme);
        setTrail(currentTrail => [...currentTrail, prev]);
        
        if (newPos.x === exitPos.x && newPos.y === exitPos.y) {
           playLevelCompleteSound();
           setTimeout(handleLevelComplete, 50);
        }
        return newPos;
      } else {
        playWallSound(currentTheme);
      }
      return prev;
    });
  }, [grid, gameState, exitPos, activeGlitch, obstacles, currentTheme]);

  const swipeHandlers = useSwipe({
    onSwipe: (dir) => movePlayer(dir),
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].indexOf(e.code) > -1) {
          e.preventDefault();
      }
      switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': movePlayer(Direction.UP); break;
        case 'arrowdown': case 's': movePlayer(Direction.DOWN); break;
        case 'arrowleft': case 'a': movePlayer(Direction.LEFT); break;
        case 'arrowright': case 'd': movePlayer(Direction.RIGHT); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  const startGame = () => {
    playStartSound();
    setLevel(1);
    setScore(0);
    setMazeSize({ w: INITIAL_SIZE, h: INITIAL_SIZE });
    setCurrentTheme(DEFAULT_THEME);
    initLevel(1, INITIAL_SIZE, INITIAL_SIZE);
  };

  const handleGameOver = () => {
    playDeathSound();
    setGameState('GAME_OVER');
  };

  const initLevel = async (lvl: number, w: number, h: number) => {
    setGameState('LEVEL_TRANSITION');
    setActiveGlitch('NONE'); 
    
    const newGrid = generateMaze(w, h);
    setGrid(newGrid);
    
    const start = { x: 0, y: 0 };
    const exit = { x: w - 1, y: h - 1 };
    
    setPlayerPos(start);
    setTrail([]); 
    setExitPos(exit);

    // Spawn Entities based on Difficulty
    let enemyCount = 0;
    let obstacleCount = 0;
    
    if (difficulty === 'NORMAL') {
       enemyCount = Math.floor(lvl / 2); // 1 at lvl 2, 2 at lvl 4
       obstacleCount = Math.floor(lvl / 1.5) + 1;
    } else if (difficulty === 'HARD') {
       enemyCount = Math.floor(lvl / 1.2) + 1;
       obstacleCount = lvl + 2;
    }

    const { enemies: newEnemies, obstacles: newObstacles } = generateEntities(
      w, h, enemyCount, obstacleCount, start, exit
    );
    setEnemies(newEnemies);
    setObstacles(newObstacles);

    let themeToUse = nextTheme;
    if (!themeToUse && lvl > 1) {
       themeToUse = await generateLevelTheme(lvl);
    } else if (lvl === 1) {
       themeToUse = DEFAULT_THEME;
    }
    
    if (themeToUse) {
      setCurrentTheme(themeToUse);
      setNextTheme(null);
    }

    setTimeout(() => {
      setGameState('PLAYING');
      generateLevelTheme(lvl + 1).then(setNextTheme);
    }, 1500);
  };

  const handleLevelComplete = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setScore(s => s + (level * 100));
    
    let newW = mazeSize.w;
    let newH = mazeSize.h;
    if (newLevel % 2 === 0 && newW < 25) {
      newW += 2;
      newH += 2;
    }
    setMazeSize({ w: newW, h: newH });
    initLevel(newLevel, newW, newH);
  };

  return (
    <div 
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-700 select-none"
      style={{ backgroundColor: currentTheme.colors.background }}
      {...swipeHandlers}
    >
      
      {activeGlitch !== 'NONE' && (
         <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 px-4 py-1 bg-red-600/80 text-white font-mono font-bold text-sm rounded animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.8)] border border-red-400">
           ⚠ SYSTEM FAILURE: {activeGlitch.replace('_', ' ')}
         </div>
      )}

      {/* HUD */}
      <div className="absolute top-4 left-0 right-0 px-6 flex justify-between items-center z-10 pointer-events-none">
         <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest opacity-70" style={{ color: currentTheme.colors.walls }}>Level</span>
            <span className="text-3xl font-black" style={{ color: currentTheme.colors.player }}>{level}</span>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest opacity-70" style={{ color: currentTheme.colors.walls }}>Score</span>
            <span className="text-2xl font-bold text-white">{score}</span>
         </div>
      </div>

      <div className="absolute bottom-4 z-10 text-center pointer-events-none opacity-50 text-xs text-white">
        <p>WASD / ARROWS / SWIPE</p>
      </div>

      {/* Settings Button */}
      {gameState === 'START' && (
        <button 
           onClick={() => setShowSettings(true)}
           className="absolute top-6 right-6 z-50 p-2 text-white/50 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* Main Game Area */}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center p-4">
        {grid.length > 0 && (
          <MazeRenderer 
            grid={grid}
            playerPos={playerPos}
            trail={trail}
            enemies={enemies}
            obstacles={obstacles}
            exitPos={exitPos}
            theme={currentTheme}
            cellSize={cellSize}
            width={mazeSize.w}
            height={mazeSize.h}
            darknessMode={currentTheme.darknessMode}
            level={level}
            glitchType={activeGlitch}
          />
        )}
      </div>

      <GameOverlay 
        gameState={gameState}
        level={level}
        score={score}
        theme={currentTheme}
        onStart={startGame}
        onRestart={startGame}
      />
      
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        volume={volume}
        setVolume={setVolume}
      />

    </div>
  );
};

export default App;