const { ccclass, property } = cc._decorator;

import { Game } from "./gameplay/Game";
import BoardView from "./view/BoardView";
import { GameConfig } from "./gameplay/GameConfig";
import HUDView from "./view/HUDView";
import GameFlow from "./gameplay/GameFlow";
import InputManager from "./input/InputManager";

@ccclass
export default class GameController extends cc.Component {
  private game: Game;
  private boardView: BoardView;
  private hud: HUDView;
  private gameFlow: GameFlow;
  private inputManager: InputManager;

  @property(cc.Label)
  score: cc.Label = null;

  @property(cc.Label)
  moves: cc.Label = null;

  @property(cc.Label)
  teleportBooster: cc.Label = null;

  @property(cc.Label)
  bombBooster: cc.Label = null;

  @property(cc.Node)
  innerBoard: cc.Node = null;

  @property(cc.Prefab)
  tilePrefab: cc.Prefab = null;

  @property([cc.SpriteFrame])
  blockSkins: cc.SpriteFrame[] = [];

  @property(cc.Node)
  teleportBoosterNode: cc.Node = null;

  @property(cc.Node)
  bombBoosterNode: cc.Node = null;

  onLoad() {
    this.hud = new HUDView(
      this.score,
      this.moves,
      this.teleportBooster,
      this.bombBooster,
    );
  }

  start() {
    this.game = new Game(GameConfig.BOARD_SIZE, GameConfig.BOARD_SIZE);
    this.boardView = new BoardView(
      this.innerBoard,
      this.tilePrefab,
      this.blockSkins,
    );

    this.boardView.initialize(this.game.board);
    this.gameFlow = new GameFlow(
      this.game,
      this.boardView,
      this.hud,
      this.showGameOver.bind(this),
    );
    this.inputManager = new InputManager(
      this.game,
      this.gameFlow,
      this.boardView,
      this.bombBoosterNode,
      this.teleportBoosterNode,
    );
    this.initInput();
  }

  activateBombBooster() {
    this.inputManager.activateBombMode();
  }

  activateTeleportBooster() {
    this.inputManager.activateTeleportMode();
  }

  private initInput() {
    this.innerBoard.on(
      cc.Node.EventType.TOUCH_END,
      this.handleBoardClick,
      this,
    );
    this.bombBoosterNode.on(
      cc.Node.EventType.TOUCH_END,
      this.activateBombBooster,
      this,
    );

    this.teleportBoosterNode.on(
      cc.Node.EventType.TOUCH_END,
      this.activateTeleportBooster,
      this,
    );
  }

  private handleBoardClick(event: cc.Event.EventTouch) {
    const boardPos = this.boardView.screenToBoardPosition(event.getLocation());
    if (!boardPos) return;

    this.inputManager.handleClick(boardPos.x, boardPos.y);
  }

  private showGameOver(win: boolean) {
    console.log(win ? "🎊 ПОБЕДА!" : "💀 ПОРАЖЕНИЕ");
  }

  onDestroy() {
    this.innerBoard.off(
      cc.Node.EventType.TOUCH_END,
      this.handleBoardClick,
      this,
    );
    this.bombBoosterNode.off(
      cc.Node.EventType.TOUCH_END,
      this.activateBombBooster,
      this,
    );

    this.teleportBoosterNode.off(
      cc.Node.EventType.TOUCH_END,
      this.activateTeleportBooster,
      this,
    );
  }
}
