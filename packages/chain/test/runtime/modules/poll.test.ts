import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import {
	OptionsHashes,
	Poll,
	PollProof,
	PollPublicOutput,
	canVote
} from "../../../src/runtime/modules/poll";
import {
	Field,
	PrivateKey,
	Nullifier,
	MerkleMap,
	Poseidon,
	Bool,
	CircuitString
} from "o1js";
import { Pickles } from "o1js/dist/node/snarky";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof-system/zkprogram";
import { log } from "@proto-kit/common";
import { Balances } from "../../../src/runtime/modules/balances";
import { UInt64 } from "@proto-kit/library";

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

	let pollModule: Poll;
	let commitmentRoot: Field;
	const pollId = CircuitString.fromString("poll-id"); // Mock poll id

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

	const optionsHashes = OptionsHashes.fromStrings(["Yes", "No"], salt);
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

	it("should create a poll with the commitment and optionsHashes", async () => {
		appChain.setSigner(alicePrivateKey);
		pollModule = appChain.runtime.resolve("Poll");

		commitmentRoot = map.getRoot();

		const tx = await appChain.transaction(alicePublicKey, async () => {
			await pollModule.createPoll(pollId, commitmentRoot, optionsHashes);
		});

		await tx.sign();
		await tx.send();
		await appChain.produceBlock();

		const poll = await appChain.query.runtime.Poll.polls.get(pollId);
		expect(poll).toBeDefined();
		expect(poll!.commitment?.toBigInt()).toBe(commitmentRoot.toBigInt());
	});

	it("should not allow creating a poll with the same id", async () => {
		const tx = await appChain.transaction(alicePublicKey, async () => {
			await pollModule.createPoll(pollId, commitmentRoot, optionsHashes);
		});

		await tx.sign();
		await tx.send();
		const block = await appChain.produceBlock();

		expect(block?.transactions[0].status.toBoolean()).toBe(false);
		expect(block?.transactions[0].statusMessage).toMatch(/Poll already exists/);
	});

	it("should allow a valid vote with correct proof", async () => {
		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier(
				CircuitString.toFields(pollId),
				alicePrivateKey
			)
		);

		const publicOutput = await canVote(aliceWitness, nullifier, pollId);
		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(alicePublicKey, async () => {
			await pollModule.vote(pollId, yesHash, pollProof);
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
			Nullifier.createTestNullifier(
				CircuitString.toFields(pollId),
				alicePrivateKey
			)
		);

		const publicOutput = await canVote(aliceWitness, nullifier, pollId);
		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(alicePublicKey, async () => {
			await pollModule.vote(pollId, yesHash, pollProof);
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
		pollModule = appChain.runtime.resolve("Poll");

		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier(
				CircuitString.toFields(pollId),
				bobPrivateKey
			)
		);

		const publicOutput = await canVote(bobWitness, nullifier, pollId);
		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(bobPublicKey, async () => {
			await pollModule.vote(pollId, noHash, pollProof);
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
		pollModule = appChain.runtime.resolve("Poll");

		const map = new MerkleMap();
		const charlieHashKey = Poseidon.hash(charliePublicKey.toFields());
		map.set(charlieHashKey, Bool(true).toField());

		const charlieWitness = map.getWitness(charlieHashKey);

		const nullifier = Nullifier.fromJSON(
			Nullifier.createTestNullifier(
				CircuitString.toFields(pollId),
				charliePrivateKey
			)
		);

		const publicOutput = await canVote(charlieWitness, nullifier, pollId);
		const pollProof = await mockProof(publicOutput);

		const tx = await appChain.transaction(charliePublicKey, async () => {
			await pollModule.vote(pollId, yesHash, pollProof);
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
		const poll = await appChain.query.runtime.Poll.polls.get(pollId);
		const votes = poll!.votes;
		expect(votes).toBeDefined();
		const yesVotes = votes.options
			.find((v) => v.hash === yesHash)
			?.votesCount.toBigInt();
		const noVotes = votes?.options
			.find((v) => v.hash === noHash)
			?.votesCount.toBigInt();
		expect(yesVotes).toBe(1n);
		expect(noVotes).toBe(1n);
	});
});
