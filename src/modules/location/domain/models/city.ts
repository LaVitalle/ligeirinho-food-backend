export class City {
  private readonly _id: number;
  private _name: string;
  private _stateId: number;

  private constructor(id: number) {
    this._id = id;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get stateId() {
    return this._stateId;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withStateId(stateId: number): this {
    this._stateId = stateId;
    return this;
  }

  static restore(
    props?: { id: number; name: string; stateId: number } | null,
  ): City | null {
    if (!props) return null;
    const c = new City(props.id);
    c._name = props.name;
    c._stateId = props.stateId;
    return c;
  }
}
