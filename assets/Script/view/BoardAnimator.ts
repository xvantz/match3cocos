import TileView from "./TileView";
import { Position } from "../gameplay/types";
import { ClickResult } from "../gameplay/Game";
import { BoardDiff } from "./diff/BoardDiff";
import { getItemType } from "./TileTypeMapper";
import { GameConfig } from "../gameplay/GameConfig";

export default class BoardAnimator {
  constructor(
    private tiles: TileView[][],
    private inactiveTiles: TileView[],
    private blockSkins: cc.SpriteFrame[],
  ) {}

  async playResult(result: ClickResult, diff: BoardDiff) {
    await this.explodeTiles(result.destroyedPositions || []);

    await this.animateBoardDiff(diff);
  }

  private async explodeTiles(positions: Position[]) {
    await Promise.all(
      positions.map(async (pos) => {
        const tile = this.tiles[pos.y][pos.x];

        if (!tile) return;

        await tile.explode();

        this.tiles[pos.y][pos.x] = null;

        this.inactiveTiles.push(tile);
      }),
    );
  }

  private async animateBoardDiff(diff: BoardDiff) {
    await this.animateTransforms(diff);

    await this.animateGravity(diff);

    await this.animateSpawns(diff);
  }

  private async animateTransforms(diff: BoardDiff) {
    for (const transform of diff.transformed) {
      const tile = this.tiles[transform.from.y][transform.from.x];
      if (!tile) continue;

      const type = getItemType(transform.tile);

      tile.init(type, this.blockSkins[type]);

      // temporarily above everything
      tile.setZIndex(99999);

      await tile.playSpecialSpawnAnimation();

      tile.startPulseAnimation();

      // restore proper layer
      tile.setZIndex((GameConfig.BOARD_SIZE - transform.to.y) * 10);
    }

    // tiny anticipation delay before gravity
    if (diff.transformed.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }

  private async animateGravity(diff: BoardDiff) {
    const promises: Promise<void>[] = [];

    const moveOperations: {
      tile: TileView;
      from: Position;
      to: Position;
    }[] = [];

    // collect moves
    for (const move of diff.moved) {
      const tile = this.tiles[move.from.y][move.from.x];

      if (!tile) continue;

      moveOperations.push({
        tile,
        from: move.from,
        to: move.to,
      });
    }

    // clear old positions
    for (const op of moveOperations) {
      this.tiles[op.from.y][op.from.x] = null;
    }

    // apply new positions
    for (const op of moveOperations) {
      this.tiles[op.to.y][op.to.x] = op.tile;

      op.tile.setBoardPosition(op.to.x, op.to.y);

      op.tile.setZIndex((GameConfig.BOARD_SIZE - op.to.y) * 10);

      promises.push(
        op.tile.moveTo(
          cc.v3(
            op.to.x * GameConfig.TILE_WIDTH,
            -op.to.y * GameConfig.TILE_HEIGHT,
            0,
          ),
        ),
      );
    }

    await Promise.all(promises);
  }

  private async animateSpawns(diff: BoardDiff) {
    const promises: Promise<void>[] = [];

    for (const spawn of diff.spawned) {
      const tile = this.inactiveTiles.pop();

      if (!tile) {
        throw new Error("Tile pool exhausted. Pooling desync detected.");
      }

      this.tiles[spawn.at.y][spawn.at.x] = tile;

      tile.setBoardPosition(spawn.at.x, spawn.at.y);

      const type = getItemType(spawn.tile);

      tile.init(type, this.blockSkins[type]);

      tile.prepareForReuse();

      tile.setZIndex((GameConfig.BOARD_SIZE - spawn.at.y) * 10);

      tile.setWorldPosition(
        spawn.at.x * GameConfig.TILE_WIDTH,
        GameConfig.TILE_HEIGHT * 2,
      );

      promises.push(
        tile.moveTo(
          cc.v3(
            spawn.at.x * GameConfig.TILE_WIDTH,
            -spawn.at.y * GameConfig.TILE_HEIGHT,
            0,
          ),
          0.35,
        ),
      );
    }

    await Promise.all(promises);
  }
}
