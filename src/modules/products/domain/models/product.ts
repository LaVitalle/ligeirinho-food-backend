export class Product {
  private readonly _id: string;
  private _canteenId: string;
  private _categoryId: string;
  private _name: string;
  private _description: string | null;
  private _price: string;
  private _photoUrl: string | null;
  private _isActive: boolean;
  private _isFeatured: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(id: string) { this._id = id; }

  get id() { return this._id; }
  get canteenId() { return this._canteenId; }
  get categoryId() { return this._categoryId; }
  get name() { return this._name; }
  get description() { return this._description; }
  get price() { return this._price; }
  get photoUrl() { return this._photoUrl; }
  get isActive() { return this._isActive; }
  get isFeatured() { return this._isFeatured; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }
  get deletedAt() { return this._deletedAt; }

  static restore(
    props?: {
      id: string;
      canteenId: string;
      categoryId: string;
      name: string;
      description?: string | null;
      price: string;
      photoUrl?: string | null;
      isActive: boolean;
      isFeatured: boolean;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date | null;
    } | null,
  ): Product | null {
    if (!props) return null;
    const p = new Product(props.id);
    p._canteenId = props.canteenId;
    p._categoryId = props.categoryId;
    p._name = props.name;
    p._description = props.description ?? null;
    p._price = props.price;
    p._photoUrl = props.photoUrl ?? null;
    p._isActive = props.isActive;
    p._isFeatured = props.isFeatured;
    p._createdAt = props.createdAt;
    p._updatedAt = props.updatedAt;
    p._deletedAt = props.deletedAt ?? null;
    return p;
  }
}
