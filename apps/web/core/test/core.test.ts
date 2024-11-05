import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import { Balances } from "chain/dist/runtime/modules/balances";
import { Poll } from "chain/dist/runtime/modules/poll";
import { UInt64 } from "@proto-kit/library";
import { PollManagerController } from "../controllers/poll-manager-controller";
import { WalletController } from "../controllers/wallet-controller";
import { WalletProvider } from "../providers/wallets/wallet-provider";
import { PrivateKey } from "o1js";
import { InMemoryPollStore } from "../controllers/poll-store";
import { ChainTestController } from "./test-utils/chain-test-controller";
import { PollController } from "../controllers/poll-controller";

const PRIVATE_KEY = "EKDii5d1dA7DDw6NZwN7jF7qcdYR5MVjZ9TfESv1gc2TvmvV2WAE";

describe("Poll Manager", () => {
  const appChain = TestingAppChain.fromRuntime({
    Balances,
    Poll,
  });

  appChain.configurePartial({
    Runtime: {
      Balances: {
        totalSupply: UInt64.from(10000),
      },
      Poll: {},
    },
  });

  const provider = new WalletProvider(PRIVATE_KEY);
  const chain = new ChainTestController(appChain);

  const wallet = new WalletController({
    provider,
    chain,
    client: appChain,
  });

  beforeAll(async () => {
    await appChain.start();
    appChain.setSigner(PrivateKey.fromBase58(PRIVATE_KEY));
  });

  it("should init the wallet", async () => {
    await wallet.init();
    expect(wallet.account).toBeDefined();
  });

  it("should create a poll manager", async () => {
    await chain.start();

    const store = new InMemoryPollStore(wallet.account as string);

    const pollManager = new PollManagerController({
      client: appChain,
      wallet,
      store,
    });

    const pollResult = await pollManager.create({
      title: "Test poll",
      description: "Test poll description",
      options: ["Option 1", "Option 2"],
      votersWallets: [wallet.account as string],
      salt: "salt",
    });

    expect(pollResult).toBeDefined();

    expect(pollResult.id).toBe(1);

    const poll = await new PollController({
      client: appChain,
      wallet,
      chain,
    });

    await poll.loadPoll(pollResult.id);

    expect(poll.votes.length).toBe(10);

    expect(poll.votes[0].votesCount).toBe(0);

    await poll.vote(pollResult.id, poll.votes[0].hash);
  });
});
