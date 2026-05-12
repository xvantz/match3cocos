import { Board } from "./Board";
import { GameConfig } from "./GameConfig";
import { Position, Tile, TileColor } from "./types";

export type SpecialTileInfo = {
  x: number;
  y: number;
  type: "bomb" | "big_bomb" | "rocket_h" | "rocket_v";
  color: TileColor;
};

export type MoveAnim = { from: Position; to: Position };
export type NewBlockAnim = { pos: Position; tile: Tile };

export type SwapResult = {
  success: boolean;
  first: Position;
  second: Position;
};

export type ClickResult = {
  success: boolean;
  reason?: string;
  destroyedPositions?: Position[];
  survivedPosition?: Position;
  specialTileCreated?: SpecialTileInfo;
  gained?: number;
  gameOver?: boolean;
  win?: boolean;
};

export class Game {
  private _board: Board;
  private _score: number = 0;
  private _moves: number;
  private _targetScore: number;
  private _bombBoosters: number;
  private _teleportBoosters: number;
  private _shuffleCount = 0;

  constructor(width: number, height: number) {
    this._board = new Board(width, height);

    this._moves = 10;
    this._targetScore = 1000;
    this._bombBoosters = 3;
    this._teleportBoosters = 2;
  }

  get targetScore() {
    return this._targetScore;
  }

  get score() {
    return this._score;
  }

  get moves() {
    return this._moves;
  }

  get board() {
    return this._board;
  }

  get bombBoosterCount() {
    return this._bombBoosters;
  }

  get teleportBoosterCount() {
    return this._teleportBoosters;
  }

  get remainingShuffles() {
    return GameConfig.MAX_SHUFFLES - this._shuffleCount;
  }

  tryShuffle(): boolean {
    if (this._shuffleCount >= GameConfig.MAX_SHUFFLES) {
      return false;
    }

    this._board.shuffle();

    this._shuffleCount++;

    return true;
  }

  hasMoves(): boolean {
    return this._board.hasMoves();
  }

  canUseBombBooster(): boolean {
    return this._bombBoosters > 0;
  }

  canUseTeleportBooster(): boolean {
    return this._teleportBoosters > 0;
  }

  consumeBombBooster(): boolean {
    if (!this.canUseBombBooster()) {
      return false;
    }

    this._bombBoosters--;

    return true;
  }

  consumeTeleportBooster(): boolean {
    if (!this.canUseTeleportBooster()) {
      return false;
    }

    this._teleportBoosters--;

    return true;
  }

  click(x: number, y: number): ClickResult {
    if (this.isGameOver()) {
      return {
        success: false,
        gameOver: true,
        win: this.isWin(),
      };
    }

    const clickedTile = this._board.get(x, y);

    if (!clickedTile) {
      return {
        success: false,
        reason: "no_group",
      };
    }

    let positions: Position[] = [];
    let isSpecialClick = false;

    if (clickedTile.type && clickedTile.type !== "normal") {
      positions = this.applySpecial(clickedTile, {
        x,
        y,
      });

      isSpecialClick = true;
    } else {
      positions = this.applyNormalEffect(x, y);

      if (positions.length < 2) {
        return {
          success: false,
          reason: "no_group",
        };
      }
    }

    if (positions.length === 0) {
      return {
        success: false,
        reason: "no_group",
      };
    }

    let specialTileInfo: SpecialTileInfo | null = null;

    if (!isSpecialClick) {
      specialTileInfo = this.determineSpecialTile(
        positions,
        x,
        y,
        clickedTile.color,
      );
    }

    let destroyedPositions = positions;

    if (specialTileInfo) {
      destroyedPositions = positions.filter(
        (p) => !(p.x === specialTileInfo.x && p.y === specialTileInfo.y),
      );
    }

    this._board.removeGroup(destroyedPositions);

    if (specialTileInfo) {
      this._board.transformTile(
        specialTileInfo.x,
        specialTileInfo.y,
        specialTileInfo.type,
      );
    }

    this._board.applyGravity();
    this._board.refill();

    const gained = positions.length * (isSpecialClick ? 10 : positions.length);

    this._score += gained;
    this._moves--;

    return {
      success: true,
      gained,
      destroyedPositions,
      survivedPosition: specialTileInfo
        ? {
            x: specialTileInfo.x,
            y: specialTileInfo.y,
          }
        : undefined,
      specialTileCreated: specialTileInfo,
      gameOver: this.isGameOver(),
      win: this.isWin(),
    };
  }

  useBombBooster(x: number, y: number): ClickResult {
    const positions = this.applyBombEffect(x, y, 1);

    this._board.removeGroup(positions);

    this._board.applyGravity();
    this._board.refill();

    return {
      success: true,
      destroyedPositions: positions,
      gained: positions.length * 5,
      gameOver: this.isGameOver(),
      win: this.isWin(),
    };
  }

  swapTiles(a: Position, b: Position): SwapResult {
    this._board.swap(a, b);

    return {
      success: true,
      first: a,
      second: b,
    };
  }

  private determineSpecialTile(
    positions: Position[],
    clickX: number,
    clickY: number,
    boardColor: TileColor,
  ): SpecialTileInfo | null {
    const size = positions.length;

    const spawnX = clickX;
    const spawnY = clickY;

    if (size === 4) {
      return {
        x: spawnX,
        y: spawnY,
        type: "bomb",
        color: boardColor,
      };
    }

    if (size === 5) {
      return {
        x: spawnX,
        y: spawnY,
        type: "big_bomb",
        color: boardColor,
      };
    }

    if (size >= 6) {
      const direction = this.detectGroupDirection(positions);

      return {
        x: spawnX,
        y: spawnY,
        type: direction === "horizontal" ? "rocket_h" : "rocket_v",
        color: boardColor,
      };
    }

    return null;
  }

  private detectGroupDirection(
    positions: Position[],
  ): "horizontal" | "vertical" {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const pos of positions) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    return width >= height ? "horizontal" : "vertical";
  }

  private isGameOver(): boolean {
    return this._moves <= 0 || this.isWin() || !this._board.hasMoves();
  }

  isWin(): boolean {
    return this._score >= this._targetScore;
  }

  isLose(): boolean {
    return this._moves <= 0 || !this._board.hasMoves();
  }

  applyNormalEffect(x: number, y: number): Position[] {
    const group = this._board.findGroup({ x, y });

    if (group.length < 2) return [];

    return group;
  }

  applyBombEffect(x: number, y: number, radius: number): Position[] {
    const result: Position[] = [];

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (
          nx >= 0 &&
          nx < this._board.width &&
          ny >= 0 &&
          ny < this._board.height
        ) {
          result.push({ x: nx, y: ny });
        }
      }
    }

    return result;
  }

  applySpecial(tile: Tile, pos: Position): Position[] {
    if (tile.type === "rocket_h") {
      return Array.from({ length: this._board.width }, (_, x) => ({
        x,
        y: pos.y,
      }));
    }

    if (tile.type === "rocket_v") {
      return Array.from({ length: this._board.height }, (_, y) => ({
        x: pos.x,
        y,
      }));
    }

    if (tile.type === "bomb") {
      return this.applyBombEffect(pos.x, pos.y, 1);
    }

    if (tile.type === "big_bomb") {
      return this.applyBombEffect(pos.x, pos.y, 2);
    }

    return [];
  }
}
