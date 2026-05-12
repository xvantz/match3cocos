import { Position, Tile } from "../../gameplay/types";

export type TileMove = {
  from: Position;
  to: Position;
  tile: Tile;
};

export type TileSpawn = {
  at: Position;
  tile: Tile;
  isSpecial?: boolean;
};

export type TileRemove = {
  at: Position;
};

export type BoardDiff = {
  removed: TileRemove[];
  moved: TileMove[];
  spawned: TileSpawn[];
  transformed: TileTransform[];
};

export type TileTransform = {
  id: number;
  from: Position;
  to: Position;
  tile: Tile;
};
