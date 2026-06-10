export class State {
  private readonly _id: number;
  private _name: string;
  private _abbreviation: string;

  private constructor(id: number) {
    this._id = id;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get abbreviation() {
    return this._abbreviation;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withAbbreviation(abbreviation: string): this {
    this._abbreviation = abbreviation;
    return this;
  }

  static restore(
    props?: { id: number; name: string; abbreviation: string } | null,
  ): State | null {
    if (!props) return null;
    const s = new State(props.id);
    s._name = props.name;
    s._abbreviation = props.abbreviation;
    return s;
  }
}
