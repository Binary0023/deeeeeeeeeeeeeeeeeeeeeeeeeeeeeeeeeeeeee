export type Cell = {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
};

export type MazeGrid = Cell[][];

export type Position = {
  x: number;
  y: number;
};

export type Enemy = {
  id: string;
  x: number;
  y: number;
};

export type Obstacle = {
  id: string;
  x: number;
  y: number;
  type: 'CORRUPTION';
};

export type Theme = {
  name: string;
  flavorText: string;
  colors: {
    background: string;
    walls: string;
    player: string;
    path: string;
    finish: string;
    enemy: string;
    obstacle: string;
  };
  darknessMode: boolean;
  soundConfig: {
    waveForm: 'sine' | 'square' | 'sawtooth' | 'triangle';
    baseFreq: number;
  };
};

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export type GlitchType = 'NONE' | 'INVERT_CONTROLS' | 'MOVE_EXIT' | 'BLACKOUT' | 'REALITY_FLUX';

export type GameState = 'START' | 'PLAYING' | 'LEVEL_TRANSITION' | 'GAME_OVER';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';