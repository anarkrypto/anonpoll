import { BaseController, Store } from "./base-controller";
import { generateAuthJsonMessage } from "@/lib/auth";
import { WalletController } from "./wallet-controller";
import { authSchema } from "@/schemas/auth";
import { z } from "zod";
import Cookies from "js-cookie";

type AuthState = {
  isAuthenticated: boolean;
  loading: boolean;
};

export class AuthController extends BaseController<AuthState> {
  wallet: WalletController;
  constructor(wallet: WalletController, store: Store<AuthState>) {
    super(store);
    this.wallet = wallet;
  }

  init (): boolean {
    const token = Cookies.get("auth.token");
    this.store.setState({ isAuthenticated: !!token, loading: false });  
    return !!token
  }

  public async authenticate(): Promise<void> {
    this.store.setState({ loading: true });
    try {
      if (!this.wallet.account) {
        await this.wallet.connect();
      }

      const issuedAt = Date.now();
      const message = generateAuthJsonMessage(window.location.origin, issuedAt);

      const { signature, publicKey } =
        await this.wallet.signJsonMessage(message);

      await fetchAuthApi({ publicKey, signature, issuedAt });
      this.store.setState({ isAuthenticated: true });
    } catch (error) {
      throw error;
    } finally {
      this.store.setState({ loading: false });
    }
  }
}

const fetchAuthApi = async ({
  publicKey,
  signature,
  issuedAt,
}: z.infer<typeof authSchema>) => {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publicKey,
      signature,
      issuedAt,
    }),
  });
  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => (typeof data.message === "string" ? data.message : null))
      .catch(() => null);
    throw new Error(
      message || `Response Status: ${response.status} (${response.statusText})`,
    );
  }
};
