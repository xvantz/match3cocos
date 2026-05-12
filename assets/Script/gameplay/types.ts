export enum TileColor {
  Red = "R",
  Green = "G",
  Blue = "B",
  Yellow = "Y",
  Purple = "P",
}

export type Position = {
  x: number;
  y: number;
};

export type EffectResult = Position[];

export type Tile = {
  id: number;
  color: TileColor;
  type?: "normal" | "rocket_h" | "rocket_v" | "bomb" | "big_bomb";
};

export type FallInfo = { x: number; from: number; to: number };
export type SpawnInfo = { x: number; y: number; tile: Tile };

export enum ItemType {
  BLUE,
  GREEN,
  PURPLE,
  RED,
  YELLOW,
  BOMB,
  BIG_BOMB,
  ROCKET_V,
  ROCKET_H,
}
