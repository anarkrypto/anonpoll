import { ModulesConfig } from "@proto-kit/common";
import { Balance, VanillaRuntimeModules } from "@proto-kit/library";

import { Balances } from "./modules/balances";
import { Poll } from "./modules/poll";

export const modules = VanillaRuntimeModules.with({
  Balances,
  Poll,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  Poll: {},
};

export default {
  modules,
  config,
};
