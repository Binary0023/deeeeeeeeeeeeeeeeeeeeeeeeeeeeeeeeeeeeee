import React, { useEffect, useRef } from 'react';
import { MazeGrid, Position, Theme, GlitchType, Enemy, Obstacle } from '../types';

interface MazeRendererProps {
  grid: MazeGrid;
  playerPos: Position;
  trail: Position[];
  enemies: Enemy[];
  obstacles: Obstacle[];
  theme: Theme;
  cellSize: number;
  width: number;
  height: number;
  exitPos: Position;
  darknessMode: boolean;
  level: number;
  glitchType: GlitchType;
}

const MazeRenderer: React.FC<MazeRendererProps> = ({
  grid,
  playerPos,
  trail,
  enemies,
  obstacles,
  theme,
  cellSize,
  width,
  height,
  exitPos,
  darknessMode,
  level,
  glitchType
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation State
  const animPos = useRef<{x: number, y: number}>({ x: playerPos.x, y: playerPos.y });
  const animationFrameId = useRef<number>(0);
  
  // Update animation target immediately when props change
  const targetPosRef = useRef(playerPos);
  
  useEffect(() => {
    targetPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas sizing
    canvas.width = width * cellSize;
    canvas.height = height * cellSize;
    
    if (Math.abs(animPos.current.x - playerPos.x) > 2 || Math.abs(animPos.current.y - playerPos.y) > 2) {
        animPos.current = { x: playerPos.x, y: playerPos.y };
    }

    const draw = () => {
      // 1. Glitch Shake Calculation
      let shakeX = 0;
      let shakeY = 0;
      if (glitchType !== 'NONE' && glitchType !== 'REALITY_FLUX') {
        shakeX = (Math.random() - 0.5) * 10;
        shakeY = (Math.random() - 0.5) * 10;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Interpolation Logic
      const speedFactor = Math.min(0.15 + (level * 0.01), 0.5);
      animPos.current.x += (targetPosRef.current.x - animPos.current.x) * speedFactor;
      animPos.current.y += (targetPosRef.current.y - animPos.current.y) * speedFactor;

      if (Math.abs(animPos.current.x - targetPosRef.current.x) < 0.001) animPos.current.x = targetPosRef.current.x;
      if (Math.abs(animPos.current.y - targetPosRef.current.y) < 0.001) animPos.current.y = targetPosRef.current.y;

      // 2. Clear
      ctx.fillStyle = theme.colors.background;
      ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20); 

      // 3. Draw Trail
      if (trail.length > 0) {
        ctx.strokeStyle = theme.colors.player;
        ctx.lineWidth = cellSize * 0.15; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.2; 

        ctx.beginPath();
        const startX = trail[0].x * cellSize + cellSize / 2;
        const startY = trail[0].y * cellSize + cellSize / 2;
        ctx.moveTo(startX, startY);

        for (let i = 1; i < trail.length; i++) {
          const tx = trail[i].x * cellSize + cellSize / 2;
          const ty = trail[i].y * cellSize + cellSize / 2;
          ctx.lineTo(tx, ty);
        }
        
        const currentPx = animPos.current.x * cellSize + cellSize / 2;
        const currentPy = animPos.current.y * cellSize + cellSize / 2;
        ctx.lineTo(currentPx, currentPy);
        
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // 4. Draw Walls 
      const renderWalls = (offsetX: number, offsetY: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        grid.forEach((row) => {
          row.forEach((cell) => {
            const x = cell.x * cellSize + offsetX;
            const y = cell.y * cellSize + offsetY;

            ctx.beginPath();
            if (cell.walls.top) { ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); }
            if (cell.walls.right) { ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); }
            if (cell.walls.bottom) { ctx.moveTo(x + cellSize, y + cellSize); ctx.lineTo(x, y + cellSize); }
            if (cell.walls.left) { ctx.moveTo(x, y + cellSize); ctx.lineTo(x, y); }
            ctx.stroke();
          });
        });
      };

      if (glitchType === 'REALITY_FLUX') {
        // Wireframe / Matrix effect
        ctx.strokeStyle = '#00ff00';
        ctx.setLineDash([2, 4]);
        renderWalls(0, 0, theme.colors.walls);
        ctx.setLineDash([]);
      } else if (glitchType !== 'NONE') {
        // RGB Split
        ctx.globalCompositeOperation = 'screen';
        renderWalls(-2, 0, '#ff0000');
        renderWalls(2, 0, '#00ffff');
        ctx.globalCompositeOperation = 'source-over';
      } else {
        renderWalls(0, 0, theme.colors.walls);
      }

      // 4.5 Draw Obstacles
      obstacles.forEach(obs => {
        const cx = obs.x * cellSize + cellSize / 2;
        const cy = obs.y * cellSize + cellSize / 2;
        
        ctx.fillStyle = theme.colors.obstacle;
        ctx.beginPath();
        // Draw X shape
        const s = cellSize * 0.3;
        ctx.moveTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy + s);
        ctx.moveTo(cx + s, cy - s);
        ctx.lineTo(cx - s, cy + s);
        ctx.strokeStyle = theme.colors.obstacle;
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // 5. Draw Exit
      const exitCx = exitPos.x * cellSize + cellSize / 2;
      const exitCy = exitPos.y * cellSize + cellSize / 2;
      const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
      
      ctx.fillStyle = theme.colors.finish;
      ctx.beginPath();
      const exitSize = (cellSize * 0.35) * pulseScale;
      ctx.rect(exitCx - exitSize, exitCy - exitSize, exitSize * 2, exitSize * 2);
      ctx.fill();

      // 6. Draw Player
      const playerCx = animPos.current.x * cellSize + cellSize / 2;
      const playerCy = animPos.current.y * cellSize + cellSize / 2;
      const r = cellSize * 0.3;

      ctx.fillStyle = theme.colors.player;
      ctx.shadowColor = theme.colors.player;
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.arc(playerCx, playerCy, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 6.5 Draw Enemies
      enemies.forEach(enemy => {
        const cx = enemy.x * cellSize + cellSize / 2;
        const cy = enemy.y * cellSize + cellSize / 2;
        
        ctx.fillStyle = theme.colors.enemy;
        ctx.shadowColor = theme.colors.enemy;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        const es = cellSize * 0.25;
        // Triangle
        ctx.moveTo(cx, cy - es);
        ctx.lineTo(cx + es, cy + es);
        ctx.lineTo(cx - es, cy + es);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      });


      // 7. Draw Fog of War
      let viewRadius = darknessMode ? cellSize * 2.5 : cellSize * 6;
      if (glitchType === 'BLACKOUT') {
        viewRadius = cellSize * 1.5;
      }

      const gradient = ctx.createRadialGradient(playerCx, playerCy, cellSize * 0.5, playerCx, playerCy, viewRadius);
      gradient.addColorStop(0, 'rgba(0,0,0,0)'); 
      
      if (darknessMode || glitchType === 'BLACKOUT') {
          gradient.addColorStop(0.8, 'rgba(0,0,0,0.95)'); 
          gradient.addColorStop(1, theme.colors.background);
      } else {
          gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);

      ctx.restore();

      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [grid, theme, cellSize, width, height, exitPos, darknessMode, trail, level, glitchType, enemies, obstacles]);

  return (
    <canvas 
      ref={canvasRef} 
      className="rounded-lg shadow-2xl"
    />
  );
};

export default MazeRenderer;