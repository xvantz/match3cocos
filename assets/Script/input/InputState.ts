export default interface InputState {
  handleClick(x: number, y: number): Promise<void>;
}
