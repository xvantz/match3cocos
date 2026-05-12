export default class HUDView {
  constructor(
    private scoreLabel: cc.Label,
    private movesLabel: cc.Label,
    private teleportBoosterLabel: cc.Label,
    private bombBoosterLabel: cc.Label,
  ) {
    this.scoreLabel.string = "0/0";
    this.movesLabel.string = "0";
    this.teleportBoosterLabel.string = "0";
    this.bombBoosterLabel.string = "0";
  }

  update(
    score: number,
    target: number,
    moves: number,
    teleportBoosters: number,
    bombBoosters: number,
  ) {
    this.scoreLabel.string = `${score}/${target}`;
    this.movesLabel.string = `${moves}`;
    this.teleportBoosterLabel.string = `${teleportBoosters}`;
    this.bombBoosterLabel.string = `${bombBoosters}`;
  }
}
