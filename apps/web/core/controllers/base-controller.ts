import { Logger } from "../utils/logger";

/**
 * @type BaseState
 *
 * Base state representation
 */
export type BaseState = Record<string, any>;

/**
 * @type Listener
 *
 * State change callbacks
 */
export type Listener<State extends BaseState> = (state: State) => void;

export class BaseController<State extends BaseState> {

  readonly defaultState: State = {} as State;
  private internalState: State;
  private internalListeners = new Set<Listener<State>>();
  protected logger: Logger;

  constructor(initialState: Partial<State> = {} as State) {
    this.logger = new Logger({
      isLocalDev: process.env.NODE_ENV === "development",
    });
    this.internalState = this.defaultState;
    this.update(initialState);
  }

  /**
   * Retrieves current controller state.
   *
   * @returns The current state.
   */
  get state() {
    return this.internalState;
  }

  /**
   * Updates controller state.
   *
   * @param state - The new state.
   * @param overwrite - Overwrite state instead of merging.
   */
  update(state: Partial<State>) {
    this.internalState = Object.assign({}, this.internalState, state);
    this.notify(this.internalState);
  }

  /**
   * Notifies all subscribed listeners of current modified state.
   */
  private notify(state: State) {
    this.internalListeners.forEach((listener) => {
      listener(state);
    });
  }

  /**
   * Adds new listener to be notified of state changes.
   *
   * @param listener - The callback triggered when state changes.
   */
  subscribe(listener: () => void) {
    this.internalListeners.add(listener);
  }

  /**
   * Removes existing listener from receiving state changes.
   *
   * @param listener - The callback to remove.
   * @returns `true` if a listener is found and unsubscribed.
   */
  unsubscribe(listener: Listener<State>) {
    return this.internalListeners.delete(listener);
  }
}
