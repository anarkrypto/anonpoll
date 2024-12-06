export {};

class CustomEventPolyfill<T = any> extends Event {
	detail: T;
	constructor(type: string, eventInitDict?: CustomEventInit<T>) {
		super(type, eventInitDict);
		this.detail = eventInitDict?.detail as T;
	}
}

declare global {
	// @ts-ignore
	var CustomEvent: typeof Event;
}

// @ts-ignore - we need this to work around the type mismatch
global.CustomEvent = CustomEventPolyfill;
