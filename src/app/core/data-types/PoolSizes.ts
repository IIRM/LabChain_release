export class PoolSizes {

  private _pending: number;
  private _available: number;
  private _inUse: number;

  constructor(pending: number, available: number, inUse:number) {
    this._pending = pending;
    this._available = available;
    this._inUse = inUse;
  }

  get inUse(): number {
    return this._inUse;
  }

  set inUse(value: number) {
    this._inUse = value;
  }

  get available(): number {
    return this._available;
  }

  set available(value: number) {
    this._available = value;
  }

  get pending(): number {
    return this._pending;
  }

  set pending(value: number) {
    this._pending = value;
  }

}
