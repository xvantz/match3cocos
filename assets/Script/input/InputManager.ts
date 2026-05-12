import InputLock from "./InputLock";
import InputState from "./InputState";
import NormalInput from "./states/NormalInput";
import BombInput from "./states/BombInput";
import TeleportInput from "./states/TeleportInput";
import GameFlow from "../gameplay/GameFlow";
import BoardView from "../view/BoardView";
import { Position } from "../gameplay/types";
import { Game } from "../gameplay/Game";

export default class InputManager {
  private currentState: InputState;
  private inputLock: InputLock;
  private normalInput: NormalInput;
  private bombInput: BombInput;
  private teleportInput: TeleportInput;

  constructor(
    private game: Game,
    private gameFlow: GameFlow,
    private boardView: BoardView,
    private bombBoosterNode: cc.Node,
    private teleportBoosterNode: cc.Node,
  ) {
    this.normalInput = new NormalInput(this.processNormalClick.bind(this));

    this.bombInput = new BombInput(this.processBombClick.bind(this));

    this.teleportInput = new TeleportInput(
      this.processTeleportFirstClick.bind(this),
      this.processTeleportSecondClick.bind(this),
    );

    this.currentState = this.normalInput;
    this.inputLock = new InputLock();
  }

  async handleClick(x: number, y: number) {
    if (this.inputLock.isLocked) return;

    await this.currentState.handleClick(x, y);
  }

  activateBombMode() {
    if (!this.game.canUseBombBooster()) return;

    if (this.currentState === this.bombInput) {
      this.activateNormalMode();
      return;
    }

    this.currentState = this.bombInput;
    this.updateBoosterVisuals();
  }

  activateTeleportMode() {
    if (!this.game.canUseTeleportBooster()) return;

    if (this.currentState === this.teleportInput) {
      this.activateNormalMode();
      return;
    }

    this.teleportInput.reset();
    this.currentState = this.teleportInput;
    this.updateBoosterVisuals();
  }

  activateNormalMode() {
    this.teleportInput.reset();
    this.currentState = this.normalInput;
    this.updateBoosterVisuals();
  }

  private async processNormalClick(x: number, y: number) {
    this.inputLock.lock();

    try {
      const tile = this.boardView.getTile(x, y);

      const result = await this.gameFlow.processClick(x, y);

      if (!result.success) {
        tile?.shakeTile();
      }
    } finally {
      this.inputLock.unlock();
    }
  }

  private async processBombClick(x: number, y: number) {
    if (!this.game.consumeBombBooster()) {
      this.activateNormalMode();
      return;
    }

    this.inputLock.lock();

    try {
      await this.gameFlow.processBombBooster(x, y);

      this.gameFlow.updateHUD();
    } finally {
      this.inputLock.unlock();

      this.activateNormalMode();
    }
  }

  private processTeleportFirstClick(x: number, y: number) {
    this.boardView.getTile(x, y)?.highlight();
  }

  private async processTeleportSecondClick(first: Position, second: Position) {
    if (!this.game.consumeTeleportBooster()) {
      this.activateNormalMode();
      return;
    }

    this.inputLock.lock();

    try {
      this.boardView.getTile(first.x, first.y)?.removeHighlight();

      await this.gameFlow.processTeleportSwap(first, second);

      this.gameFlow.updateHUD();
    } finally {
      this.inputLock.unlock();

      this.activateNormalMode();
    }
  }

  private updateBoosterVisuals() {
    this.setBoosterSelected(
      this.bombBoosterNode,
      this.currentState === this.bombInput,
    );

    this.setBoosterSelected(
      this.teleportBoosterNode,
      this.currentState === this.teleportInput,
    );
  }

  private setBoosterSelected(node: cc.Node, selected: boolean) {
    node.scale = selected ? 1.1 : 1.0;
    node.opacity = selected ? 255 : 180;
  }
}
