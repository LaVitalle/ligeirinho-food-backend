export class Canteen {
  private readonly _id: string;
  private _institutionId: string;
  private _name: string;
  private _cnpj: string | null;
  private _block: string | null;
  private _room: string | null;
  private _logoUrl: string | null;
  private _isOpen: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(id: string) {
    this._id = id;
  }

  get id() { return this._id; }
  get institutionId() { return this._institutionId; }
  get name() { return this._name; }
  get cnpj() { return this._cnpj; }
  get block() { return this._block; }
  get room() { return this._room; }
  get logoUrl() { return this._logoUrl; }
  get isOpen() { return this._isOpen; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }
  get deletedAt() { return this._deletedAt; }

  withName(name: string): this { this._name = name; return this; }
  withCnpj(cnpj: string | null): this { this._cnpj = cnpj; return this; }
  withBlock(block: string | null): this { this._block = block; return this; }
  withRoom(room: string | null): this { this._room = room; return this; }
  withLogoUrl(logoUrl: string | null): this { this._logoUrl = logoUrl; return this; }
  withIsOpen(isOpen: boolean): this { this._isOpen = isOpen; return this; }

  static restore(
    props?: {
      id: string;
      institutionId: string;
      name: string;
      cnpj?: string | null;
      block?: string | null;
      room?: string | null;
      logoUrl?: string | null;
      isOpen: boolean;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date | null;
    } | null,
  ): Canteen | null {
    if (!props) return null;
    const c = new Canteen(props.id);
    c._institutionId = props.institutionId;
    c._name = props.name;
    c._cnpj = props.cnpj ?? null;
    c._block = props.block ?? null;
    c._room = props.room ?? null;
    c._logoUrl = props.logoUrl ?? null;
    c._isOpen = props.isOpen;
    c._createdAt = props.createdAt;
    c._updatedAt = props.updatedAt;
    c._deletedAt = props.deletedAt ?? null;
    return c;
  }
}
