import { UserRole } from "@shared/domain/enums/user-role.enum";

export class User {
  private readonly _id: string;
  private _fullName: string;
  private _email: string;
  private _passwordHash: string;
  private _phoneNumber?: string | null;
  private _profilePhotoUrl?: string | null;
  private _role: UserRole;
  private _institutionId?: string | null;
  private _canteenId?: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string) {
    this._id = id;
  }

  get id() {
    return this._id;
  }

  get fullName() {
    return this._fullName;
  }

  get email() {
    return this._email;
  }

  get passwordHash() {
    return this._passwordHash;
  }

  get phoneNumber() {
    return this._phoneNumber ?? null;
  }

  get profilePhotoUrl() {
    return this._profilePhotoUrl ?? null;
  }

  get role() {
    return this._role;
  }

  get institutionId() {
    return this._institutionId ?? null;
  }

  get canteenId() {
    return this._canteenId ?? null;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  withFullName(fullName: string): this {
    this._fullName = fullName;
    return this;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  withPasswordHash(passwordHash: string): this {
    this._passwordHash = passwordHash;
    return this;
  }

  withPhoneNumber(phoneNumber?: string | null): this {
    this._phoneNumber = phoneNumber ?? null;
    return this;
  }

  withProfilePhotoUrl(profilePhotoUrl?: string | null): this {
    this._profilePhotoUrl = profilePhotoUrl ?? null;
    return this;
  }

  withRole(role: UserRole): this {
    this._role = role;
    return this;
  }

  withInstitutionId(institutionId?: string | null): this {
    this._institutionId = institutionId ?? null;
    return this;
  }

  withCanteenId(canteenId?: string | null): this {
    this._canteenId = canteenId ?? null;
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
          fullName: string;
          email: string;
          passwordHash: string;
          phoneNumber?: string | null;
          profilePhotoUrl?: string | null;
          role: UserRole;
          institutionId?: string | null;
          canteenId?: string | null;
          createdAt: Date;
          updatedAt: Date;
        }
      | null,
  ): User | null {
    if (!props) return null;
    const u = new User(props.id);
    u._fullName = props.fullName;
    u._email = props.email;
    u._passwordHash = props.passwordHash;
    u._phoneNumber = props.phoneNumber ?? null;
    u._profilePhotoUrl = props.profilePhotoUrl ?? null;
    u._role = props.role;
    u._institutionId = props.institutionId ?? null;
    u._canteenId = props.canteenId ?? null;
    u._createdAt = props.createdAt;
    u._updatedAt = props.updatedAt;
    return u;
  }
}

