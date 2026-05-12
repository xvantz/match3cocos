import {
  BoardDiff,
  TileMove,
  TileSpawn,
  TileRemove,
  TileTransform,
} from "./BoardDiff";
import { Tile } from "../../gameplay/types";

export default class BoardDiffBuilder {
  static build(before: (Tile | null)[][], after: (Tile | null)[][]): BoardDiff {
    const removed: TileRemove[] = [];
    const moved: TileMove[] = [];
    const spawned: TileSpawn[] = [];
    const transformed: TileTransform[] = [];

    const beforeMap = new Map<number, { x: number; y: number; tile: Tile }>();
    const afterMap = new Map<number, { x: number; y: number; tile: Tile }>();

    const height = before.length;
    const width = before[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const beforeTile = before[y][x];
        const afterTile = after[y][x];

        if (beforeTile) {
          beforeMap.set(beforeTile.id, {
            x,
            y,
            tile: beforeTile,
          });
        }

        if (afterTile) {
          afterMap.set(afterTile.id, {
            x,
            y,
            tile: afterTile,
          });
        }
      }
    }

    // removed
    beforeMap.forEach((beforeData, id) => {
      if (!afterMap.has(id)) {
        removed.push({
          at: {
            x: beforeData.x,
            y: beforeData.y,
          },
        });
      }
    });

    // spawned
    afterMap.forEach((afterData, id) => {
      if (!beforeMap.has(id)) {
        spawned.push({
          at: {
            x: afterData.x,
            y: afterData.y,
          },
          tile: afterData.tile,
          isSpecial: afterData.tile.type !== "normal",
        });
      }
    });

    // moved
    beforeMap.forEach((beforeData, id) => {
      const afterData = afterMap.get(id);

      if (!afterData) return;
      if (beforeData.tile.type !== afterData.tile.type) {
        transformed.push({
          id,
          from: {
            x: beforeData.x,
            y: beforeData.y,
          },
          to: {
            x: afterData.x,
            y: afterData.y,
          },
          tile: afterData.tile,
        });
      }

      if (beforeData.x !== afterData.x || beforeData.y !== afterData.y) {
        moved.push({
          from: {
            x: beforeData.x,
            y: beforeData.y,
          },
          to: {
            x: afterData.x,
            y: afterData.y,
          },
          tile: beforeData.tile,
        });
      }
    });

    return {
      removed,
      moved,
      spawned,
      transformed,
    };
  }
}
