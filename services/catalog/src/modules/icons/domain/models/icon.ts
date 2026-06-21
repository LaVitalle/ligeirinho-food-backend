export class Icon {
  private readonly _id: string;
  private _key: string;
  private _name: string;
  private _url: string;
  private _tag: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string) {
    this._id = id;
  }

  get id() { return this._id; }
  get key() { return this._key; }
  get name() { return this._name; }
  get url() { return this._url; }
  get tag() { return this._tag; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  static restore(
    props?: {
      id: string;
      key: string;
      name: string;
      url: string;
      tag?: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null,
  ): Icon | null {
    if (!props) return null;
    const i = new Icon(props.id);
    i._key = props.key;
    i._name = props.name;
    i._url = props.url;
    i._tag = props.tag ?? null;
    i._createdAt = props.createdAt;
    i._updatedAt = props.updatedAt;
    return i;
  }
}
