export interface Position {
  line: number;
  column: number;
}

export interface Location {
  start: Position;
  end: Position;
}
