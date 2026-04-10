export interface Position {
  line: number;
  column: number;
}

export interface Location {
  path: string;
  start: Position;
  end: Position;
}
