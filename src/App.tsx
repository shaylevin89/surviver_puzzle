import React, { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import { Cell, Shape, GameState, ShapeType } from './types';

const BOARD_WIDTH = 4;
const BOARD_HEIGHT = 6;
const TOTAL_CELLS = BOARD_WIDTH * BOARD_HEIGHT;

const initialShapes: Shape[] = [
  { type: 'square', cells: [2, 3, 6, 7] },
  { type: 'l1', cells: [9, 10, 13] },
  { type: 'l2', cells: [11, 12, 16] },
  { type: 'l3', cells: [17, 21, 22] },
  { type: 'l4', cells: [20, 23, 24] },
];

const createInitialState = (): GameState => {
  const cells: Cell[] = Array.from({ length: TOTAL_CELLS }, (_, index) => ({
    id: index + 1,
    shape: null,
  }));

  initialShapes.forEach(shape => {
    shape.cells.forEach(cellId => {
      cells[cellId - 1].shape = shape.type;
    });
  });

  return { cells, shapes: initialShapes };
};

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null);
  const [time, setTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; shape: ShapeType | null } | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number } | null>(null);
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState());
    setSelectedShape(null);
    setTime(0);
  }, []);

  // Add timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const moveShape = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedShape) return;

    const shape = gameState.shapes.find(s => s.type === selectedShape);
    if (!shape) return;

    const newCells = [...gameState.cells];
    const newShapes = [...gameState.shapes];
    const shapeIndex = newShapes.findIndex(s => s.type === selectedShape);

    let newPositions: number[] = [];
    let canMove = true;

    switch (direction) {
      case 'up':
        newPositions = shape.cells.map(id => id - BOARD_WIDTH);
        break;
      case 'down':
        newPositions = shape.cells.map(id => id + BOARD_WIDTH);
        break;
      case 'left':
        newPositions = shape.cells.map(id => id - 1);
        break;
      case 'right':
        newPositions = shape.cells.map(id => id + 1);
        break;
    }

    // Check if move is valid
    for (const newPos of newPositions) {
      // Check if position is within board bounds
      if (newPos < 1 || newPos > TOTAL_CELLS) {
        canMove = false;
        break;
      }

      // Check if moving horizontally across board edges
      if (
        (direction === 'right' && newPos % BOARD_WIDTH === 1) ||
        (direction === 'left' && newPos % BOARD_WIDTH === 0)
      ) {
        canMove = false;
        break;
      }

      // Check if new position is occupied by another shape
      const cellAtNewPos = newCells[newPos - 1];
      if (cellAtNewPos.shape && cellAtNewPos.shape !== selectedShape) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      // Clear old positions
      shape.cells.forEach(id => {
        newCells[id - 1].shape = null;
      });

      // Set new positions
      newPositions.forEach(id => {
        newCells[id - 1].shape = selectedShape;
      });

      newShapes[shapeIndex] = {
        ...shape,
        cells: newPositions,
      };

      setGameState({ cells: newCells, shapes: newShapes });
    }
  }, [selectedShape, gameState]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!selectedShape) return;

    switch (event.key) {
      case 'ArrowUp':
        moveShape('up');
        break;
      case 'ArrowDown':
        moveShape('down');
        break;
      case 'ArrowLeft':
        moveShape('left');
        break;
      case 'ArrowRight':
        moveShape('right');
        break;
      default:
        return;
    }
  }, [selectedShape, moveShape]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    const target = event.target as HTMLElement;
    const cellId = parseInt(target.getAttribute('data-cell-id') || '0');
    const cell = gameState.cells[cellId - 1];
    
    if (cell.shape) {
      setSelectedShape(cell.shape);
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        shape: cell.shape
      };
      lastMoveRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    }
  }, [gameState.cells]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchStartRef.current || !selectedShape || !lastMoveRef.current) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - lastMoveRef.current.x;
    const deltaY = touch.clientY - lastMoveRef.current.y;

    // Minimum movement threshold
    const minMoveDistance = 5;

    // Clear any existing interval
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
    }

    // Determine movement direction and speed
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minMoveDistance) {
        const direction = deltaX > 0 ? 'right' : 'left';
        moveShape(direction);
        lastMoveRef.current = {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    } else {
      if (Math.abs(deltaY) > minMoveDistance) {
        const direction = deltaY > 0 ? 'down' : 'up';
        moveShape(direction);
        lastMoveRef.current = {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    }
  }, [selectedShape, moveShape]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    lastMoveRef.current = null;
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, [handleKeyDown]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      <div className="controls">
        <button className="restart-button" onClick={handleRestart}>
          Restart
        </button>
        <div className="timer">{formatTime(time)}</div>
      </div>
      <div 
        className="board"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {gameState.cells.map(cell => (
          <div
            key={cell.id}
            data-cell-id={cell.id}
            className={`cell ${cell.shape || ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export default App; 