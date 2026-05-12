import { FallInfo, Position, SpawnInfo, Tile, TileColor } from "./types";

export class Board {
  private nextTileId = 1;
  width: number;
  height: number;
  grid: (Tile | null)[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = [];

    this.generate();
  }

  private generate() {
    for (let y = 0; y < this.height; y++) {
      const row: (Tile | null)[] = [];

      for (let x = 0; x < this.width; x++) {
        row.push(this.randomTile());
      }

      this.grid.push(row);
    }
  }

  private randomTile(): Tile {
    const colors = Object.values(TileColor);

    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: this.nextTileId++,
      color,
      type: "normal",
    };
  }

  get(x: number, y: number): Tile | null {
    return this.grid[y]?.[x] ?? null;
  }

  set(x: number, y: number, tile: Tile | null) {
    this.grid[y][x] = tile;
  }

  transformTile(
    x: number,
    y: number,
    type: "bomb" | "big_bomb" | "rocket_h" | "rocket_v",
  ) {
    const tile = this.get(x, y);

    if (!tile) return;

    tile.type = type;
  }

  swap(a: Position, b: Position) {
    const temp = this.get(a.x, a.y);

    this.set(a.x, a.y, this.get(b.x, b.y));
    this.set(b.x, b.y, temp);
  }

  getNeighbors(pos: Position): Position[] {
    const directions = [
      { x: 0, y: -1 }, // вверх
      { x: 0, y: 1 }, // вниз
      { x: -1, y: 0 }, // влево
      { x: 1, y: 0 }, // вправо
    ];

    const result: Position[] = [];

    for (const dir of directions) {
      const nx = pos.x + dir.x;
      const ny = pos.y + dir.y;

      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        result.push({ x: nx, y: ny });
      }
    }

    return result;
  }

  findGroup(start: Position): Position[] {
    const startTile = this.get(start.x, start.y);
    if (!startTile) return [];

    const targetColor = startTile.color;

    const visited = new Set<string>();
    const stack: Position[] = [start];
    const group: Position[] = [];

    const key = (p: Position) => `${p.x},${p.y}`;

    while (stack.length > 0) {
      const current = stack.pop()!;
      const k = key(current);

      if (visited.has(k)) continue;
      visited.add(k);

      const tile = this.get(current.x, current.y);
      if (!tile || tile.color !== targetColor) continue;

      group.push(current);

      const neighbors = this.getNeighbors(current);
      for (const n of neighbors) {
        stack.push(n);
      }
    }

    return group;
  }

  removeGroup(group: Position[]) {
    for (const pos of group) {
      this.set(pos.x, pos.y, null);
    }
  }

  applyGravity(): FallInfo[] {
    const falls: FallInfo[] = [];
    const height = this.height;

    for (let x = 0; x < this.width; x++) {
      let writeY = height - 1;
      for (let y = height - 1; y >= 0; y--) {
        if (this.grid[y][x]) {
          if (y !== writeY) {
            falls.push({ x, from: y, to: writeY });
            this.grid[writeY][x] = this.grid[y][x];
            this.grid[y][x] = null;
          }
          writeY--;
        }
      }
    }
    return falls;
  }

  refill(): SpawnInfo[] {
    const spawns: SpawnInfo[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (!this.grid[y][x]) {
          const newTile = this.randomTile();
          this.grid[y][x] = newTile;
          spawns.push({ x, y, tile: newTile });
        }
      }
    }
    return spawns;
  }

  hasMoves(): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.get(x, y);
        if (!tile) continue;

        const neighbors = this.getNeighbors({ x, y });

        for (const n of neighbors) {
          const other = this.get(n.x, n.y);
          if (other && other.color === tile.color) {
            return true;
          }
        }
      }
    }

    return false;
  }

  shuffle() {
    const tiles: Tile[] = [];

    // собираем
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.get(x, y);
        if (tile) tiles.push(tile);
      }
    }

    // перемешиваем (Fisher-Yates)
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // возвращаем
    let i = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.set(x, y, tiles[i++]);
      }
    }
  }

  createSpecialTile(x: number, y: number, type: string, color: string) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }

    let tileType: "bomb" | "big_bomb" | "rocket_h" | "rocket_v" = "bomb";

    switch (type) {
      case "big_bomb":
        tileType = "big_bomb";
        break;

      case "rocket_h":
        tileType = "rocket_h";
        break;

      case "rocket_v":
        tileType = "rocket_v";
        break;

      default:
        tileType = "bomb";
    }

    this.grid[y][x] = {
      id: this.nextTileId++,
      color: color as TileColor,
      type: tileType,
    };
  }

  cloneGrid(): (Tile | null)[][] {
    return this.grid.map((row) =>
      row.map((tile) =>
        tile
          ? {
              id: tile.id,
              color: tile.color,
              type: tile.type,
            }
          : null,
      ),
    );
  }
}
