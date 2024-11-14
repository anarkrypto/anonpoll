import { AuthState } from "../controllers/auth-controller";
import { useZeroPollContext } from "../context-provider";

export const useAuth = (): AuthState & {
  authenticate: () => Promise<void>;
} => {
  const { authState, engine } = useZeroPollContext();
  return {
    ...authState,
    authenticate: () => engine.context.auth.authenticate(),
  };
};