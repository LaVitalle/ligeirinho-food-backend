import { PaymentMethodType } from "./payment-method-type";

export class PaymentMethod {
  private readonly _id: string;
  private _name: string;
  private _description: string | null;
  private _type: PaymentMethodType;
  private _iconKey: string | null;
  private _displayOrder: number;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string) {
    this._id = id;
  }

  get id() { return this._id; }
  get name() { return this._name; }
  get description() { return this._description; }
  get type() { return this._type; }
  get iconKey() { return this._iconKey; }
  get displayOrder() { return this._displayOrder; }
  get isActive() { return this._isActive; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  static restore(
    props?: {
      id: string;
      name: string;
      description?: string | null;
      type: PaymentMethodType;
      iconKey?: string | null;
      displayOrder: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    } | null,
  ): PaymentMethod | null {
    if (!props) return null;
    const pm = new PaymentMethod(props.id);
    pm._name = props.name;
    pm._description = props.description ?? null;
    pm._type = props.type;
    pm._iconKey = props.iconKey ?? null;
    pm._displayOrder = props.displayOrder;
    pm._isActive = props.isActive;
    pm._createdAt = props.createdAt;
    pm._updatedAt = props.updatedAt;
    return pm;
  }
}
