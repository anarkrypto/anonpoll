import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import { Balances } from "chain/dist/runtime/modules/balances";
import { Poll } from "chain/dist/runtime/modules/poll";
import { UInt64 } from "@proto-kit/library";
import { PollManagerController } from "../controllers/poll-manager-controller";
import { WalletController } from "../controllers/wallet-controller";
import { Wallet } from "../signers/wallet";
import { PrivateKey } from "o1js";
import { InMemoryContentStore } from "../stores/content-store";
import { ChainTestController } from "./test-utils/chain-test-controller";
import { PollController } from "../controllers/poll-controller";
import { CID } from "multiformats/cid";
import { PollData } from "@/types/poll";

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

  const chain = new ChainTestController(appChain);

  const wallet = new WalletController({
    chain,
    client: appChain,
  });

  let store: InMemoryContentStore<PollData>;
  let pollId: string

  beforeAll(async () => {
    await appChain.start();
    appChain.setSigner(PrivateKey.fromBase58(PRIVATE_KEY));
  });

  it("should init the wallet", async () => {
    const provider = new Wallet(PRIVATE_KEY);
    await wallet.init(provider);
    expect(wallet.account).toBeDefined();
  });

  it("should create a poll", async () => {
    await chain.start();

    store = new InMemoryContentStore<PollData>();

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

    const cid = CID.parse(pollResult.id);

    expect(cid.version).toBe(1);

    pollId = pollResult.id;
  });

  it("should load and vote in the poll", async () => {

    const poll = await new PollController({
      client: appChain,
      wallet,
      chain,
      store,
    });

    await poll.loadPoll(pollId);

    expect(poll.options.length).toBe(2);

    expect(poll.options[0].votesCount).toBe(0);

    await poll.vote(poll.options[0].hash);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(poll.options[0].votesCount).toBe(1);
  });
});
