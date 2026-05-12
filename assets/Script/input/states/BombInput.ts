import InputState from "../InputState";

export default class BombInput implements InputState {
  constructor(private onClick: (x: number, y: number) => Promise<void>) {}

  async handleClick(x: number, y: number): Promise<void> {
    await this.onClick(x, y);
  }
}
