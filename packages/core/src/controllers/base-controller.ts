import { Logger } from '@/utils/logger';

export interface BaseConfig {
	isDevelopment?: boolean;
}

/**
 * @type BaseState
 *
 * Base state representation
 */
export interface BaseState {}

/**
 * @type Listener
 *
 * State change callbacks
 */
export type Listener<State extends BaseState> = (
	fullState: State,
	changedState: Partial<State>
) => void;

export class BaseController<
	Config extends BaseConfig,
	State extends BaseState,
> {
	private internalConfig: Config;
	private internalState: State;

	private internalListeners = new Set<Listener<State>>();
	protected logger: Logger;

	constructor(config: Config, state: State) {
		this.logger = new Logger({
			isLocalDev: config.isDevelopment,
		});
		this.internalConfig = config;
		this.internalState = state;
	}

	/**
	 * Retrieves current controller configuration options.
	 *
	 * @returns The current configuration.
	 */
	get config() {
		return this.internalConfig;
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
	 * Updates controller configuration.
	 *
	 * @param config - New configuration options.
	 * @param overwrite - Overwrite config instead of merging.
	 */
	protected configure(config: Partial<Config>, overwrite = false) {
		this.internalConfig = overwrite
			? (config as Config)
			: Object.assign(this.internalConfig, config);
	}

	/**
	 * Updates controller state.
	 *
	 * @param state - The new state.
	 * @param overwrite - Overwrite state instead of merging.
	 */
	protected update(state: Partial<State>) {
		this.internalState = Object.assign({}, this.internalState, state);
		this.notify(this.internalState, state);
	}

	/**
	 * Notifies all subscribed listeners of current modified state.
	 */
	private notify(fullState: State, changedState: Partial<State>) {
		this.internalListeners.forEach(listener => {
			listener(fullState, changedState);
		});
	}

	/**
	 * Adds new listener to be notified of state changes.
	 *
	 * @param listener - The callback triggered when state changes.
	 * @returns A function to unsubscribe the listener.
	 */
	subscribe(listener: Listener<State>) {
		this.internalListeners.add(listener);
		return () => this.unsubscribe(listener);
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
