import TileView from "./TileView";
import { Position, Tile } from "../gameplay/types";
import { ClickResult } from "../gameplay/Game";
import { getItemType } from "./TileTypeMapper";
import { Board } from "../gameplay/Board";
import { GameConfig } from "../gameplay/GameConfig";
import BoardDiffBuilder from "./diff/BoardDiffBuilder";
import BoardAnimator from "./BoardAnimator";

export default class BoardView {
  private tiles: TileView[][] = [];
  private inactiveTiles: TileView[] = [];
  private animator: BoardAnimator;

  constructor(
    private boardNode: cc.Node,
    private tilePrefab: cc.Prefab,
    private blockSkins: cc.SpriteFrame[],
  ) {
    this.animator = new BoardAnimator(
      this.tiles,
      this.inactiveTiles,
      this.blockSkins,
    );
  }

  initialize(board: Board) {
    for (let y = 0; y < GameConfig.BOARD_SIZE; y++) {
      this.tiles[y] = [];

      for (let x = 0; x < GameConfig.BOARD_SIZE; x++) {
        const node = cc.instantiate(this.tilePrefab);

        this.boardNode.addChild(node);

        node.setAnchorPoint(0, 1);

        node.setContentSize(
          GameConfig.TILE_WIDTH,
          GameConfig.TILE_FIRST_HEIGHT,
        );

        node.setPosition(
          x * GameConfig.TILE_WIDTH,
          -y * GameConfig.TILE_HEIGHT,
        );

        node.zIndex = (GameConfig.BOARD_SIZE - y) * 10;

        const tileView = new TileView(node, x, y);

        const tileData = board.get(x, y);

        if (tileData) {
          const type = getItemType(tileData);

          tileView.init(type, this.blockSkins[type]);

          tileView.activate();
        } else {
          tileView.deactivate();
        }

        this.tiles[y][x] = tileView;
      }
    }
  }

  getTile(x: number, y: number) {
    return this.tiles[y]?.[x];
  }

  async applyResult(
    result: ClickResult,
    beforeBoard: (Tile | null)[][],
    board: Board,
  ) {
    const diff = BoardDiffBuilder.build(beforeBoard, board.cloneGrid());

    await this.animator.playResult(result, diff);
  }

  async animateSwap(a: Position, b: Position) {
    const tileA = this.tiles[a.y][a.x];
    const tileB = this.tiles[b.y][b.x];

    this.assertTileExists(tileA, "swap A");
    this.assertTileExists(tileB, "swap B");

    const posA = tileA.node.position.clone();
    const posB = tileB.node.position.clone();

    this.tiles[a.y][a.x] = tileB;
    this.tiles[b.y][b.x] = tileA;

    tileA.setBoardPosition(b.x, b.y);
    tileB.setBoardPosition(a.x, a.y);

    tileA.setZIndex((GameConfig.BOARD_SIZE - b.y) * 10);

    tileB.setZIndex((GameConfig.BOARD_SIZE - a.y) * 10);

    await Promise.all([tileA.moveTo(posB, 0.2), tileB.moveTo(posA, 0.2)]);
  }

  async playShuffle(board: Board) {
    const animations: Promise<void>[] = [];

    for (let y = 0; y < GameConfig.BOARD_SIZE; y++) {
      for (let x = 0; x < GameConfig.BOARD_SIZE; x++) {
        const tile = this.tiles[y][x];

        if (!tile) continue;

        animations.push(tile.shuffleDisappear());
      }
    }

    await Promise.all(animations);

    for (let y = 0; y < GameConfig.BOARD_SIZE; y++) {
      for (let x = 0; x < GameConfig.BOARD_SIZE; x++) {
        const tile = this.tiles[y][x];
        const tileData = board.get(x, y);

        if (!tile || !tileData) continue;

        const type = getItemType(tileData);

        tile.init(type, this.blockSkins[type]);
      }
    }

    const appearAnimations: Promise<void>[] = [];

    for (let y = 0; y < GameConfig.BOARD_SIZE; y++) {
      for (let x = 0; x < GameConfig.BOARD_SIZE; x++) {
        const tile = this.tiles[y][x];

        if (!tile) continue;

        appearAnimations.push(tile.shuffleAppear());
      }
    }

    await Promise.all(appearAnimations);
  }

  screenToBoardPosition(worldPos: cc.Vec2): Position | null {
    const localPos = this.boardNode.convertToNodeSpaceAR(worldPos);
    const x = Math.floor(localPos.x / GameConfig.TILE_WIDTH);
    const y = Math.floor(-localPos.y / GameConfig.TILE_HEIGHT);
    if (
      x < 0 ||
      x >= GameConfig.BOARD_SIZE ||
      y < 0 ||
      y >= GameConfig.BOARD_SIZE
    )
      return null;
    return { x, y };
  }

  private assertTileExists(tile: TileView | null, context: string) {
    if (!tile) throw new Error(`Tile missing: ${context}`);
  }
}
