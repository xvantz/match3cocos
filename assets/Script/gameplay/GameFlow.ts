import { Game, ClickResult } from "../gameplay/Game";
import BoardView from "../view/BoardView";
import HUDView from "../view/HUDView";
import { Position } from "./types";

export default class GameFlow {
  constructor(
    private game: Game,
    private boardView: BoardView,
    private hud: HUDView,
    private onGameOver: (win: boolean) => void,
  ) {
    this.updateHUD();
  }

  async processClick(x: number, y: number): Promise<ClickResult> {
    const beforeBoard = this.game.board.cloneGrid();

    const result = this.game.click(x, y);

    if (!result.success) {
      return result;
    }

    await this.boardView.applyResult(result, beforeBoard, this.game.board);

    this.updateHUD();

    if (!this.game.hasMoves()) {
      await this.processShuffle();
    }

    if (result.gameOver) {
      this.onGameOver(!!result.win);
    }

    return result;
  }

  async processBombBooster(x: number, y: number) {
    const beforeBoard = this.game.board.cloneGrid();

    const result = this.game.useBombBooster(x, y);

    await this.boardView.applyResult(result, beforeBoard, this.game.board);

    this.updateHUD();

    if (!this.game.hasMoves()) {
      await this.processShuffle();
    }

    if (result.gameOver) {
      this.onGameOver(!!result.win);
    }
  }

  async processTeleportSwap(first: Position, second: Position) {
    this.game.swapTiles(first, second);

    await this.boardView.animateSwap(first, second);

    this.updateHUD();

    if (!this.game.hasMoves()) await this.processShuffle();
  }

  private async processShuffle() {
    const success = this.game.tryShuffle();

    if (!success) {
      this.onGameOver(false);
      return;
    }

    await this.boardView.playShuffle(this.game.board);
  }

  updateHUD() {
    this.hud.update(
      this.game.score,
      this.game.targetScore,
      this.game.moves,
      this.game.teleportBoosterCount,
      this.game.bombBoosterCount,
    );
  }
}
