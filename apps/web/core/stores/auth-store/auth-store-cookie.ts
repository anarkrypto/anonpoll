import Cookies from "js-cookie";
import { AbstractAuthStore } from "./abstract-auth-store";

const AUTH_TOKEN_KEY = "auth.token";

export class AuthStoreCookie implements AbstractAuthStore {
  async get() {
    return Cookies.get(AUTH_TOKEN_KEY) || null;
  }
  async set(value: string) {
    Cookies.set(AUTH_TOKEN_KEY, value);
  }
  async delete() {
    Cookies.remove(AUTH_TOKEN_KEY);
  }
}
