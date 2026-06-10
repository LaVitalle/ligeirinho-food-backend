export class Extra {
  private readonly _id: string;
  private _canteenId: string;
  private _name: string;
  private _price: string;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(id: string) { this._id = id; }

  get id() { return this._id; }
  get canteenId() { return this._canteenId; }
  get name() { return this._name; }
  get price() { return this._price; }
  get isActive() { return this._isActive; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }
  get deletedAt() { return this._deletedAt; }

  static restore(
    props?: {
      id: string;
      canteenId: string;
      name: string;
      price: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date | null;
    } | null,
  ): Extra | null {
    if (!props) return null;
    const e = new Extra(props.id);
    e._canteenId = props.canteenId;
    e._name = props.name;
    e._price = props.price;
    e._isActive = props.isActive;
    e._createdAt = props.createdAt;
    e._updatedAt = props.updatedAt;
    e._deletedAt = props.deletedAt ?? null;
    return e;
  }
}
