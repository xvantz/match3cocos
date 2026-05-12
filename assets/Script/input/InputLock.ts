export default class InputLock {
  private locked = false;

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  get isLocked() {
    return this.locked;
  }
}
