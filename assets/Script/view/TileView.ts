import { ItemType } from "../gameplay/types";

export default class TileView {
  private _node: cc.Node;
  private _sprite: cc.Sprite;
  private _type: ItemType = ItemType.BLUE;

  public boardX: number;
  public boardY: number;

  constructor(node: cc.Node, boardX: number, boardY: number) {
    this._node = node;
    this._sprite = node.getComponent(cc.Sprite);

    this.boardX = boardX;
    this.boardY = boardY;
  }

  get type() {
    return this._type;
  }

  get node() {
    return this._node;
  }

  get active() {
    return this._node.active;
  }

  setBoardPosition(x: number, y: number) {
    this.boardX = x;
    this.boardY = y;
  }

  setWorldPosition(x: number, y: number) {
    this._node.setPosition(x, y);
  }

  setZIndex(z: number) {
    this._node.zIndex = z;
  }

  setScale(scale: number) {
    this._node.scale = scale;
  }

  setOpacity(opacity: number) {
    this._node.opacity = opacity;
  }

  activate() {
    this._node.active = true;
  }

  deactivate() {
    this._node.active = false;
  }

  resetVisualState() {
    cc.Tween.stopAllByTarget(this._node);

    this._node.scale = 1;
    this._node.opacity = 255;
  }

  stopAnimations() {
    cc.Tween.stopAllByTarget(this._node);
  }

  resetScale() {
    this._node.scale = 1;
  }

  resetOpacity() {
    this._node.opacity = 255;
  }

  prepareForReuse() {
    this.activate();
    this.resetVisualState();
  }

  init(type: ItemType, skin: cc.SpriteFrame) {
    this._type = type;

    this._sprite.spriteFrame = skin;

    this.resetVisualState();
  }

  highlight() {
    this.resetVisualState();

    this.node.zIndex = 9999;

    cc.tween(this.node)
      .to(0.1, {
        scale: 1.15,
      })
      .start();
  }

  removeHighlight() {
    this.resetVisualState();
  }

  async shuffleDisappear(): Promise<void> {
    return new Promise((resolve) => {
      cc.tween(this.node)
        .to(0.15, {
          scale: 0,
          opacity: 0,
        })
        .call(resolve)
        .start();
    });
  }

  async shuffleAppear(): Promise<void> {
    this.node.scale = 0;
    this.node.opacity = 0;

    return new Promise((resolve) => {
      cc.tween(this.node)
        .to(
          0.2,
          {
            scale: 1,
            opacity: 255,
          },
          {
            easing: "backOut",
          },
        )
        .call(resolve)
        .start();
    });
  }

  async explode(): Promise<void> {
    cc.Tween.stopAllByTarget(this._node);

    return new Promise((resolve) => {
      cc.tween(this._node)
        .to(0.15, {
          scale: 1.3,
          opacity: 200,
        })
        .to(0.15, {
          scale: 0.1,
          opacity: 0,
        })
        .call(() => {
          this._node.active = false;
          resolve();
        })
        .start();
    });
  }

  async moveTo(pos: cc.Vec3, duration: number = 0.25): Promise<void> {
    cc.Tween.stopAllByTarget(this._node);

    return new Promise((resolve) => {
      cc.tween(this._node)
        .to(duration, { position: pos }, { easing: "bounceOut" })
        .call(() => {
          resolve();
        })
        .start();
    });
  }

  async playSpecialSpawnAnimation(): Promise<void> {
    cc.Tween.stopAllByTarget(this._node);

    return new Promise((resolve) => {
      cc.tween(this._node)
        .to(0.12, { scale: 1.25 }, { easing: "backOut" })
        .to(0.08, { scale: 1.0 })
        .call(() => {
          resolve();
        })
        .start();
    });
  }

  shakeTile() {
    this.resetVisualState();

    const startX = this._node.x;
    const startY = this._node.y;

    cc.tween(this._node)
      .to(0.05, {
        position: cc.v3(startX + 5, startY, 0),
      })
      .to(0.1, {
        position: cc.v3(startX - 5, startY, 0),
      })
      .to(0.05, {
        position: cc.v3(startX, startY, 0),
      })
      .start();
  }

  startPulseAnimation() {
    cc.Tween.stopAllByTarget(this._node);

    cc.tween(this._node)
      .to(0.5, { scale: 1.1 })
      .to(0.5, { scale: 1.0 })
      .union()
      .repeatForever()
      .start();
  }
}
