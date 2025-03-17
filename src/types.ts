export type ShapeType = 'square' | 'l1' | 'l2' | 'l3' | 'l4';

export interface Cell {
  id: number;
  shape: ShapeType | null;
}

export interface Shape {
  type: ShapeType;
  cells: number[];
}

export interface GameState {
  cells: Cell[];
  shapes: Shape[];
} 