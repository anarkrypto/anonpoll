import { Nullifier } from "o1js";
import { Wallet } from "./wallet";

const PRIVATE_KEY = "EKDii5d1dA7DDw6NZwN7jF7qcdYR5MVjZ9TfESv1gc2TvmvV2WAE";
const PUBLIC_KEY = "B62qmRM1veRpkCG2DmWW1EgpKUG9v1rzSJmVk8NFKbWoQNnTn5DSFdT";
const MESSAGE = [{ label: "test", value: "value" }];
const SIGNATURE = {
  field:
    "3394017280451117600420093108833637645662721222233985678373717430468549672803",
  scalar:
    "5003877927592045049099348194761688175226406931215278503665343987914313673531",
};
const NULLIFIER_MESSAGE = [1, 2, 3];
const PUBLIC_NULLIFIER = {
  x: "16328654144496084616124974522426892648212109057250397692171658540018141180936",
  y: "18469873671525319656139126885608171147056061985301257653191233428329290065205",
};

describe("WalletProvider", () => {
  let walletProvider: Wallet;

  beforeEach(() => {
    walletProvider = new Wallet(PRIVATE_KEY);
  });

  test("should initialize with private key and create MinaClient", () => {
    expect(walletProvider).toBeDefined();
    expect(walletProvider.client).toBeDefined();
  });

  test("should retrieve account using requestAccount", async () => {
    const publicKey = await walletProvider.requestAccount();
    expect(publicKey).toBe(PUBLIC_KEY);
  });

  test("should get account using getAccount", async () => {
    const publicKey = await walletProvider.getAccount();
    expect(publicKey).toBe(PUBLIC_KEY);
  });

  test("should create nullifier", async () => {
    const nullifier = await walletProvider.createNullifier({
      message: NULLIFIER_MESSAGE,
    });
    expect(nullifier).toBeInstanceOf(Nullifier);
    expect(nullifier.public.nullifier.toJSON()).toEqual(PUBLIC_NULLIFIER);
  });

  test("should sign JSON message", async () => {
    const signedMessage = await walletProvider.signJsonMessage({
      message: MESSAGE,
    });

    expect(signedMessage).toEqual({
      data: JSON.stringify(MESSAGE),
      publicKey: PUBLIC_KEY,
      signature: { field: SIGNATURE.field, scalar: SIGNATURE.scalar },
    });
  });
});
