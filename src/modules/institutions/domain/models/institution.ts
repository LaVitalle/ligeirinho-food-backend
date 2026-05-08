export class Institution {
  private readonly _id: string;
  private _name: string;
  private _photoUrl?: string | null;
  private _accessCode: string;
  private _stateId: number;
  private _cityId: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string) {
    this._id = id;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get photoUrl() {
    return this._photoUrl ?? null;
  }

  get accessCode() {
    return this._accessCode;
  }

  get stateId() {
    return this._stateId;
  }

  get cityId() {
    return this._cityId;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withPhotoUrl(photoUrl?: string | null): this {
    this._photoUrl = photoUrl ?? null;
    return this;
  }

  withAccessCode(accessCode: string): this {
    this._accessCode = accessCode;
    return this;
  }

  withStateId(stateId: number): this {
    this._stateId = stateId;
    return this;
  }

  withCityId(cityId: number): this {
    this._cityId = cityId;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  static restore(
    props?:
      | {
          id: string;
          name: string;
          photoUrl?: string | null;
          accessCode: string;
          stateId: number;
          cityId: number;
          createdAt: Date;
          updatedAt: Date;
        }
      | null,
  ): Institution | null {
    if (!props) return null;
    const i = new Institution(props.id);
    i._name = props.name;
    i._photoUrl = props.photoUrl ?? null;
    i._accessCode = props.accessCode;
    i._stateId = props.stateId;
    i._cityId = props.cityId;
    i._createdAt = props.createdAt;
    i._updatedAt = props.updatedAt;
    return i;
  }
}
