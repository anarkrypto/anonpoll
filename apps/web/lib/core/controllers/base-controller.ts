import { Logger } from "../utils/logger";

export type BaseState = Record<string, any>;

export type Store<State extends BaseState> = {
  getState: () => State;
  setState: (state: Partial<State>) => void;
  subscribe: (listener: () => void) => () => void;
};

export class BaseController<State extends BaseState> {
  protected state: State;
  protected store: Store<State>;
  protected logger: Logger;

  constructor(store: Store<State>) {
    this.store = store;
    this.logger = new Logger({ isLocalDev: process.env.NODE_ENV === "development" });
    this.state = {} as State;
  }
}