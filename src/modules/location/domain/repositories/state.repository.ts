import { State } from "../models/state";

export const STATE_REPOSITORY = Symbol("STATE_REPOSITORY");

export interface StateRepository {
  findAll(): Promise<State[]>;
}
