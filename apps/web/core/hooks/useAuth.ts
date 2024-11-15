import { AuthState } from "../controllers/auth-controller";
import { useSyncExternalStore } from "react";
import { useControllers } from "./useControllers";

export interface UseAuthReturn extends AuthState {
  authenticate: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { auth: authController } = useControllers();

  const authState = useSyncExternalStore(
    authController.subscribe,
    () => authController.state,
  );

  return {
    ...authState,
    authenticate: () => authController.authenticate(),
  };
};