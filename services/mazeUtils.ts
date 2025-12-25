import { Cell, MazeGrid, Position, Enemy, Obstacle } from '../types';

export const generateMaze = (width: number, height: number): MazeGrid => {
  // Initialize grid
  const grid: MazeGrid = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    grid.push(row);
  }

  const stack: Cell[] = [];
  const startCell = grid[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, grid, width, height);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWalls(current, next);
      next.visited = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  return grid;
};

const getUnvisitedNeighbors = (cell: Cell, grid: MazeGrid, width: number, height: number): Cell[] => {
  const neighbors: Cell[] = [];
  const { x, y } = cell;

  if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]); 
  if (x < width - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]); 
  if (y < height - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]); 
  if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]); 

  return neighbors;
};

const removeWalls = (a: Cell, b: Cell) => {
  const xDiff = a.x - b.x;
  const yDiff = a.y - b.y;

  if (xDiff === 1) { 
    a.walls.left = false;
    b.walls.right = false;
  } else if (xDiff === -1) { 
    a.walls.right = false;
    b.walls.left = false;
  }

  if (yDiff === 1) { 
    a.walls.top = false;
    b.walls.bottom = false;
  } else if (yDiff === -1) { 
    a.walls.bottom = false;
    b.walls.top = false;
  }
};

export const canMove = (current: Position, direction: 'up' | 'down' | 'left' | 'right', grid: MazeGrid): boolean => {
  if (current.y < 0 || current.y >= grid.length || current.x < 0 || current.x >= grid[0].length) return false;
  const cell = grid[current.y][current.x];
  if (direction === 'up') return !cell.walls.top;
  if (direction === 'right') return !cell.walls.right;
  if (direction === 'down') return !cell.walls.bottom;
  if (direction === 'left') return !cell.walls.left;
  return false;
};

export const generateEntities = (
  width: number, 
  height: number, 
  enemyCount: number, 
  obstacleCount: number,
  excludeStart: Position,
  excludeEnd: Position
): { enemies: Enemy[], obstacles: Obstacle[] } => {
  const enemies: Enemy[] = [];
  const obstacles: Obstacle[] = [];
  const occupied = new Set<string>();

  occupied.add(`${excludeStart.x},${excludeStart.y}`);
  occupied.add(`${excludeEnd.x},${excludeEnd.y}`);

  // Helpers
  const getKey = (x: number, y: number) => `${x},${y}`;

  // Generate Enemies
  for(let i=0; i<enemyCount; i++) {
    let placed = false;
    let attempts = 0;
    while(!placed && attempts < 50) {
      const rx = Math.floor(Math.random() * width);
      const ry = Math.floor(Math.random() * height);
      const key = getKey(rx, ry);
      
      // Don't spawn too close to start
      const dist = Math.abs(rx - excludeStart.x) + Math.abs(ry - excludeStart.y);

      if (!occupied.has(key) && dist > 3) {
        enemies.push({ id: `e-${i}`, x: rx, y: ry });
        occupied.add(key);
        placed = true;
      }
      attempts++;
    }
  }

  // Generate Obstacles
  for(let i=0; i<obstacleCount; i++) {
    let placed = false;
    let attempts = 0;
    while(!placed && attempts < 50) {
      const rx = Math.floor(Math.random() * width);
      const ry = Math.floor(Math.random() * height);
      const key = getKey(rx, ry);
      
      const dist = Math.abs(rx - excludeStart.x) + Math.abs(ry - excludeStart.y);

      if (!occupied.has(key) && dist > 2) {
        obstacles.push({ id: `o-${i}`, x: rx, y: ry, type: 'CORRUPTION' });
        occupied.add(key);
        placed = true;
      }
      attempts++;
    }
  }

  return { enemies, obstacles };
};