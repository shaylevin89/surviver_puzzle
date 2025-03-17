import React, { useState, useCallback, useRef } from 'react';
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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState());
    setSelectedShape(null);
  }, []);

  const handleCellClick = useCallback((cellId: number) => {
    const cell = gameState.cells[cellId - 1];
    if (cell.shape) {
      setSelectedShape(cell.shape);
    }
  }, [gameState.cells]);

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
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchStartRef.current || !selectedShape) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Minimum swipe distance threshold
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          moveShape('right');
        } else {
          moveShape('left');
        }
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          moveShape('down');
        } else {
          moveShape('up');
        }
      }
    }

    touchStartRef.current = null;
  }, [selectedShape, moveShape]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="App">
      <button className="restart-button" onClick={handleRestart}>
        Restart
      </button>
      <div 
        className="board"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {gameState.cells.map(cell => (
          <div
            key={cell.id}
            className={`cell ${cell.shape || ''} ${selectedShape === cell.shape ? 'selected' : ''}`}
            onClick={() => handleCellClick(cell.id)}
          />
        ))}
      </div>
      <div className="mobile-controls">
        <button className="direction-button up" onClick={() => moveShape('up')}>↑</button>
        <div className="horizontal-controls">
          <button className="direction-button left" onClick={() => moveShape('left')}>←</button>
          <button className="direction-button right" onClick={() => moveShape('right')}>→</button>
        </div>
        <button className="direction-button down" onClick={() => moveShape('down')}>↓</button>
      </div>
    </div>
  );
}

export default App; 