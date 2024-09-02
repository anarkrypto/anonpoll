import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import {
	Poll,
	PollProof,
	PollPublicOutput,
	canVote,
	message
} from "../../../src/runtime/modules/poll";
import { Field, PrivateKey, Nullifier, MerkleMap, Poseidon, Bool } from "o1js";
import { Pickles } from "o1js/dist/node/snarky";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof-system/zkprogram";
import { log } from "@proto-kit/common";
import { Balances } from "../../../src/runtime/modules/balances";
import { UInt64 } from "@proto-kit/library";

log.setLevel("ERROR");

describe("Poll", () => {
	let appChain: ReturnType<
		typeof TestingAppChain.fromRuntime<{
			Poll: typeof Poll;
			Balances: typeof Balances;
		}>
	>;

	let poll: Poll;
	let commitmentRoot: Field;

	const alicePrivateKey = PrivateKey.fromBigInt(BigInt(1));
	const alicePublicKey = alicePrivateKey.toPublicKey();

	const bobPrivateKey = PrivateKey.fromBigInt(BigInt(2));
	const bobPublicKey = bobPrivateKey.toPublicKey();

	const map = new MerkleMap();

	const aliceHashKey = Poseidon.hash(alicePublicKey.toFields());
	const bobHashKey = Poseidon.hash(bobPublicKey.toFields());

	map.set(aliceHashKey, Bool(true).toField());
	map.set(bobHashKey, Bool(true).toField());

	const aliceWitness = map.getWitness(aliceHashKey);
	const bobWitness = map.getWitness(bobHashKey);

	async function mockProof(publicOutput: PollPublicOutput): Promise<PollProof> {
		const [, proof] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
		return new PollProof({
			proof: proof,
			maxProofsVerified: 2,
			publicInput: undefined,
			publicOutput
		});
	}

	async function setupPollWithCommitment() {
		const tx = await appChain.transaction(alicePublicKey, async () => {
			await poll.setCommitment(commitmentRoot);
		});
		await tx.sign();
		await tx.send();
		await appChain.produceBlock();
	}

	beforeAll(async () => {
		appChain = TestingAppChain.fromRuntime({
			Balances,
			Poll
		});

		appChain.configurePartial({
			Runtime: {
				Balances: {
					totalSupply: UInt64.from(10000)
				},
				Poll: {}
			}
		});

		await appChain.start();
		appChain.setSigner(alicePrivateKey);
		poll = appChain.runtime.resolve("Poll");

		commitmentRoot = map.getRoot();
		await setupPollWithCommitment();
	});

	it("should correctly set the poll commitment root", async () => {
		const commitment = await appChain.query.runtime.Poll.commitment.get();
		expect(commitment?.toBigInt()).toBe(commitmentRoot.toBigInt());
	});

	it("should allow a valid vote with correct proof", async () => {
		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier(message, alicePrivateKey)
		);

		const publicOutput = await canVote(aliceWitness, nullifier);
		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(alicePublicKey, async () => {
			await poll.vote(Bool(true), pollProof);
		});

		await tx.sign();
		await tx.send();

		const block = await appChain.produceBlock();

		const storedNullifier = await appChain.query.runtime.Poll.nullifiers.get(
			pollProof.publicOutput.nullifier
		);

		expect(block?.transactions[0].status.toBoolean()).toBe(true);
		expect(storedNullifier?.toBoolean()).toBe(true);
	});

	it("should prevent voting with a reused nullifier", async () => {
		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier([Field(0)], alicePrivateKey)
		);

		const publicOutput = await canVote(aliceWitness, nullifier);
		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(alicePublicKey, async () => {
			await poll.vote(Bool(true), pollProof);
		});

		await tx.sign();
		await tx.send();

		const block = await appChain.produceBlock();

		const storedNullifier = await appChain.query.runtime.Poll.nullifiers.get(
			pollProof.publicOutput.nullifier
		);

		expect(block?.transactions[0].status.toBoolean()).toBe(false);
		expect(block?.transactions[0].statusMessage).toMatch(
			/Nullifier has already been used/
		);
		expect(storedNullifier?.toBoolean()).toBe(true);
	});

	it("should allow another valid vote from a different participant", async () => {
		appChain.setSigner(bobPrivateKey);
		poll = appChain.runtime.resolve("Poll");

		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier(message, bobPrivateKey)
		);

		const publicOutput = await canVote(bobWitness, nullifier);
		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(bobPublicKey, async () => {
			await poll.vote(Bool(false), pollProof);
		});

		await tx.sign();
		await tx.send();

		const block = await appChain.produceBlock();

		const storedNullifier = await appChain.query.runtime.Poll.nullifiers.get(
			pollProof.publicOutput.nullifier
		);

		expect(block?.transactions[0].status.toBoolean()).toBe(true);
		expect(storedNullifier?.toBoolean()).toBe(true);
	});

	it("should correctly count votes", async () => {
		const votes = await appChain.query.runtime.Poll.votes.get();
		expect(votes?.yayes.toBigInt()).toBe(1n);
		expect(votes?.nays.toBigInt()).toBe(1n);
	});

	it("should not allow invalid participant proof", async () => {
		const bobPrivateKey = PrivateKey.random();
		const bobPublicKey = bobPrivateKey.toPublicKey();

		appChain.setSigner(bobPrivateKey);
		poll = appChain.runtime.resolve("Poll");

		const map = new MerkleMap();
		const bobHashKey = Poseidon.hash(bobPublicKey.toFields());
		map.set(bobHashKey, Bool(true).toField());

		const bobWitness = map.getWitness(bobHashKey);

		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier(message, bobPrivateKey)
		);

		const publicOutput = await canVote(bobWitness, nullifier);

		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(bobPublicKey, async () => {
			await poll.vote(Bool(true), pollProof);
		});

		await tx.sign();
		await tx.send();

		const block = await appChain.produceBlock();

		expect(block?.transactions[0].status.toBoolean()).toBe(false);
		expect(block?.transactions[0].statusMessage).toMatch(
			/Poll proof does not contain the correct commitment/
		);
	});
});
