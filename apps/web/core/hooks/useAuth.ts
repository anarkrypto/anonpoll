import { AuthState } from "../controllers/auth-controller";
import { useZeroPollContext } from "../context-provider";

export interface UseAuthReturn extends AuthState {
  authenticate: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { authState, engine } = useZeroPollContext();
  return {
    ...authState,
    authenticate: () => engine.context.auth.authenticate(),
  };
};
