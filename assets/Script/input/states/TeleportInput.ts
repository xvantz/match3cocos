import InputState from "../InputState";
import { Position } from "../../gameplay/types";

export default class TeleportInput implements InputState {
  private firstSelection: Position | null = null;

  constructor(
    private onFirstSelected: (x: number, y: number) => void,
    private onSecondSelected: (
      first: Position,
      second: Position,
    ) => Promise<void>,
  ) {}

  async handleClick(x: number, y: number): Promise<void> {
    // первый клик
    if (!this.firstSelection) {
      this.firstSelection = { x, y };

      this.onFirstSelected(x, y);

      return;
    }

    // второй клик
    const first = this.firstSelection;

    this.firstSelection = null;

    await this.onSecondSelected(first, {
      x,
      y,
    });
  }

  reset() {
    this.firstSelection = null;
  }
}
