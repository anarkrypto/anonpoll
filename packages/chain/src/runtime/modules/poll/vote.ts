import { assert } from "@proto-kit/protocol";
import {
	Field,
	Bool,
	Struct,
	Poseidon,
	MerkleMapWitness,
	Nullifier,
	ZkProgram,
	Provable,
	CircuitString,
	MerkleMap
} from "o1js";

export class Vote extends Struct({
	hash: Field,
	votesCount: Field
}) {}

export class OptionHash extends Field {
	static fromString(str: string, salt: string = ""): Field {
		return Poseidon.hash(
			CircuitString.toFields(
				CircuitString.fromString(str).append(CircuitString.fromString(salt))
			)
		);
	}
}

export class OptionsHashes extends Struct({
	hashes: [Field, Field, Field, Field, Field, Field, Field, Field, Field, Field] // 10 options
}) {
	// Should be excuted on the client
	static fromStrings(options: string[], salt: string = "") {
		return new OptionsHashes({
			// Hash options inputs using Poseidon and fill the rest with
			// indexes to make sure the hashes are unique
			hashes: Array(10)
				.fill(Field(0))
				.map((_, i) => OptionHash.fromString(options[i] || i.toString(), salt))
		});
	}

	static fromHashes(hashes: Field[]) {
		assert(Bool(hashes.length === 10), "Invalid number of hashes");
		return new OptionsHashes({
			hashes: hashes
		});
	}
}

export class Votes extends Struct({
	options: [Vote, Vote, Vote, Vote, Vote, Vote, Vote, Vote, Vote, Vote] // 10 options
}) {
	static cast(prevOptions: Votes, optionHash: Field) {
		let found = Bool(false);
		for (let i = 0; i < prevOptions.options.length; i++) {
			const match = prevOptions.options[i].hash.equals(optionHash);
			prevOptions.options[i] = new Vote({
				hash: prevOptions.options[i].hash,
				votesCount: prevOptions.options[i].votesCount.add(
					Provable.if(match, Field(1), Field(0))
				)
			});
			found = Provable.if(match, Bool(true), found);
		}
		assert(found, "Invalid option hash");
		return prevOptions;
	}

	static fromOptionsHashes(optionsHashes: OptionsHashes) {
		return new Votes({
			options: optionsHashes.hashes.map((hash) => {
				return new Vote({
					hash,
					votesCount: Field(0)
				});
			})
		});
	}
}

export class VotePublicInputs extends Struct({
	pollId: CircuitString,
	optionHash: Field,
	votersRoot: Field
}) {}

export class VotePrivateInputs extends Struct({
	nullifier: Nullifier,
	votersWitness: MerkleMapWitness
}) {}

export class VotePublicOutputs extends Struct({
	optionHash: Field,
	nullifier: Field
}) {}

export const voteProgram = ZkProgram({
	name: "PollVote",
	publicInput: VotePublicInputs,
	publicOutput: VotePublicOutputs,
	methods: {
		voteInInviteOnlyPoll: {
			privateInputs: [VotePrivateInputs],
			method: async (
				publicInput: VotePublicInputs,
				privateInput: VotePrivateInputs
			) => {
				const key = Poseidon.hash(
					privateInput.nullifier.getPublicKey().toFields()
				);
				const [computedRoot, computedKey] =
					privateInput.votersWitness.computeRootAndKey(Bool(true).toField());

				computedRoot.assertEquals(publicInput.votersRoot);
				computedKey.assertEquals(key);

				const message = CircuitString.toFields(publicInput.pollId);
				privateInput.nullifier.verify(message);

				return {
					publicOutput: new VotePublicOutputs({
						optionHash: publicInput.optionHash,
						nullifier: privateInput.nullifier.key()
					})
				};
			}
		},
		voteInOpenPoll: {
			privateInputs: [VotePrivateInputs],
			method: async (
				publicInput: VotePublicInputs,
				privateInput: VotePrivateInputs
			) => {
				const emptyRoot = new MerkleMap().getRoot();

				publicInput.votersRoot.assertEquals(emptyRoot, "Invalid open poll");

				const message = CircuitString.toFields(publicInput.pollId);
				privateInput.nullifier.verify(message);

				return {
					publicOutput: new VotePublicOutputs({
						optionHash: publicInput.optionHash,
						nullifier: privateInput.nullifier.key()
					})
				};
			}
		}
	}
});

export class VoteProof extends ZkProgram.Proof(voteProgram) {}
