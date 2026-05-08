export class Category {
  private readonly _id: string;
  private _name: string;
  private _iconKey: string | null;
  private _displayOrder: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string) {
    this._id = id;
  }

  get id() { return this._id; }
  get name() { return this._name; }
  get iconKey() { return this._iconKey; }
  get displayOrder() { return this._displayOrder; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  static restore(
    props?: {
      id: string;
      name: string;
      iconKey?: string | null;
      displayOrder: number;
      createdAt: Date;
      updatedAt: Date;
    } | null,
  ): Category | null {
    if (!props) return null;
    const c = new Category(props.id);
    c._name = props.name;
    c._iconKey = props.iconKey ?? null;
    c._displayOrder = props.displayOrder;
    c._createdAt = props.createdAt;
    c._updatedAt = props.updatedAt;
    return c;
  }
}
