export abstract class AbstractAuthStore {
  abstract get(): Promise<string | null>;
  abstract set(value: string): Promise<void>;
  abstract delete(): Promise<void>;
}
