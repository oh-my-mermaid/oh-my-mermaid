export interface Platform {
  /** Display name (e.g. "Claude Code") */
  name: string;
  /** CLI-facing id (e.g. "claude") */
  id: string;
  /** Is the tool binary installed on this machine? */
  detect(): boolean;
  /** Are omm skills already registered? */
  isSetup(): boolean;
  /** Register omm skills/plugin */
  setup(): Promise<void>;
  /** Unregister omm skills/plugin */
  teardown(): void;
}
