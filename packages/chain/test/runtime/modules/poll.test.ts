import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import {
	OptionsHashes,
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
import { UInt64, UInt32 } from "@proto-kit/library";

log.setLevel("ERROR");

describe("Poll", () => {
	const appChain = TestingAppChain.fromRuntime({
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

	let poll: Poll;
	let commitmentRoot: Field;
	let pollId: UInt32;

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

	const salt = PrivateKey.random().toBase58();

	const optionsHashes = OptionsHashes.fromTexts(["Yes", "No"], salt);
	const yesHash = optionsHashes.hashes[0];
	const noHash = optionsHashes.hashes[1];

	async function mockProof(publicOutput: PollPublicOutput): Promise<PollProof> {
		const [, proof] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
		return new PollProof({
			proof: proof,
			maxProofsVerified: 2,
			publicInput: undefined,
			publicOutput
		});
	}

	beforeAll(async () => {
		await appChain.start();
	});

	it("should create a poll with the commitment root", async () => {
		appChain.setSigner(alicePrivateKey);
		poll = appChain.runtime.resolve("Poll");

		commitmentRoot = map.getRoot();

		const tx = await appChain.transaction(alicePublicKey, async () => {
			await poll.createPoll(commitmentRoot, optionsHashes);
		});

		await tx.sign();
		await tx.send();
		await appChain.produceBlock();

		const lastPollId = await appChain.query.runtime.Poll.lastPollId.get();
		expect(lastPollId?.toBigInt()).toBe(1n);

		pollId = UInt32.from(1n);

		const commitment =
			await appChain.query.runtime.Poll.commitments.get(pollId);
		expect(commitment?.toBigInt()).toBe(commitmentRoot.toBigInt());
	});

	it("should allow a valid vote with correct proof", async () => {
		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier(message, alicePrivateKey)
		);

		const publicOutput = await canVote(aliceWitness, nullifier);
		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(alicePublicKey, async () => {
			await poll.vote(pollId, yesHash, pollProof);
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
			await poll.vote(pollId, yesHash, pollProof);
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
			await poll.vote(pollId, noHash, pollProof);
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

	it("should not allow invalid participant proof", async () => {
		const charliePrivateKey = PrivateKey.random();
		const charliePublicKey = charliePrivateKey.toPublicKey();

		appChain.setSigner(charliePrivateKey);
		poll = appChain.runtime.resolve("Poll");

		const map = new MerkleMap();
		const charlieHashKey = Poseidon.hash(charliePublicKey.toFields());
		map.set(charlieHashKey, Bool(true).toField());

		const charlieWitness = map.getWitness(charlieHashKey);

		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier(message, charliePrivateKey)
		);

		const publicOutput = await canVote(charlieWitness, nullifier);

		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(charliePublicKey, async () => {
			await poll.vote(pollId, yesHash, pollProof);
		});

		await tx.sign();
		await tx.send();

		const block = await appChain.produceBlock();

		expect(block?.transactions[0].status.toBoolean()).toBe(false);
		expect(block?.transactions[0].statusMessage).toMatch(
			/Poll proof does not contain the correct commitment/
		);
	});

	it("should correctly count votes", async () => {
		const votes = await appChain.query.runtime.Poll.votes.get(pollId);
		const yesVotes = votes?.options.find((v) => v.hash === yesHash)?.votesCount.toBigInt();
		const noVotes = votes?.options.find((v) => v.hash === noHash)?.votesCount.toBigInt();
		expect(yesVotes).toBe(1n);
		expect(noVotes).toBe(1n);
	});
});
