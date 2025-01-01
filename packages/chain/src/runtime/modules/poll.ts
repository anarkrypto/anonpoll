/*
	NOTE: The proof verification has known vulnerabilities while Protokit is in development
	and snarky is not implemented yet.
*/

import { UInt32 } from "@proto-kit/library";
import {
	runtimeModule,
	state,
	runtimeMethod,
	RuntimeModule
} from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import {
	Field,
	Bool,
	Struct,
	Poseidon,
	MerkleMapWitness,
	Nullifier,
	ZkProgram,
	Provable,
	CircuitString
} from "o1js";

export class Vote extends Struct({
	hash: Field,
	votesCount: UInt32
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
				votesCount: UInt32.Unsafe.fromField(
					prevOptions.options[i].votesCount.value.add(
						Provable.if(match, Field(1), Field(0))
					)
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
					votesCount: UInt32.from(0)
				});
			})
		});
	}
}

export class PollStruct extends Struct({
	votersRoot: Field,
	votes: Votes
}) {}

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
		vote: {
			privateInputs: [VotePrivateInputs],
			method: async (
				publicInput: VotePublicInputs,
				privateInput: VotePrivateInputs
			): Promise<VotePublicOutputs> => {
				const key = Poseidon.hash(
					privateInput.nullifier.getPublicKey().toFields()
				);
				const [computedRoot, computedKey] =
					privateInput.votersWitness.computeRootAndKeyV2(Bool(true).toField());

				computedRoot.assertEquals(publicInput.votersRoot);
				computedKey.assertEquals(key);

				const message = CircuitString.toFields(publicInput.pollId);
				privateInput.nullifier.verify(message);

				return new VotePublicOutputs({
					optionHash: publicInput.optionHash,
					nullifier: privateInput.nullifier.key()
				});
			}
		}
	}
});

export class VoteProof extends ZkProgram.Proof(voteProgram) {}

@runtimeModule()
export class Poll extends RuntimeModule {
	@state() public polls = StateMap.from<CircuitString, PollStruct>(
		CircuitString,
		PollStruct
	);
	@state() public nullifiers = StateMap.from<Field, Bool>(Field, Bool);

	@runtimeMethod()
	public async createPoll(
		id: CircuitString,
		votersRoot: Field,
		optionsHashes: OptionsHashes
	) {
		const checkPoll = await this.polls.get(id);
		assert(checkPoll.isSome.not(), "Poll already exists");
		await this.polls.set(
			id,
			new PollStruct({
				votersRoot,
				votes: Votes.fromOptionsHashes(optionsHashes)
			})
		);
	}

	@runtimeMethod()
	public async vote(proof: VoteProof) {
		const pollId = proof.publicInput.pollId;

		proof.verify();

		const poll = await this.polls.get(pollId);

		assert(poll.isSome, "Poll does not exist");

		assert(
			proof.publicInput.votersRoot.equals(poll.value.votersRoot),
			"Poll proof does not contain the correct votersRoot"
		);

		const isNullifierUsed = await this.nullifiers.get(
			proof.publicOutput.nullifier
		);

		assert(isNullifierUsed.value.not(), "Nullifier has already been used");

		await this.nullifiers.set(proof.publicOutput.nullifier, Bool(true));

		const currentVotes = await poll.value.votes;

		await this.polls.set(
			pollId,
			new PollStruct({
				votersRoot: poll.value.votersRoot,
				votes: Votes.cast(currentVotes, proof.publicOutput.optionHash)
			})
		);
	}
}
