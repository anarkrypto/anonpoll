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

export class VoteOption extends Struct({
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

export class VoteOptions extends Struct({
	options: [
		VoteOption,
		VoteOption,
		VoteOption,
		VoteOption,
		VoteOption,
		VoteOption,
		VoteOption,
		VoteOption,
		VoteOption,
		VoteOption
	] // 10 options
}) {
	static cast(prevOptions: VoteOptions, optionHash: Field) {
		for (let i = 0; i < prevOptions.options.length; i++) {
			prevOptions.options[i] = new VoteOption({
				hash: prevOptions.options[i].hash,
				votesCount: UInt32.Unsafe.fromField(
					prevOptions.options[i].votesCount.value.add(
						Provable.if(
							prevOptions.options[i].hash.equals(optionHash),
							Field(1),
							Field(0)
						)
					)
				)
			});
		}
		return prevOptions;
	}

	static fromOptionsHashes(optionsHashes: OptionsHashes) {
		return new VoteOptions({
			options: optionsHashes.hashes.map((hash) => {
				return new VoteOption({
					hash,
					votesCount: UInt32.from(0)
				});
			})
		});
	}
}

export class PollStruct extends Struct({
	commitment: Field,
	votes: VoteOptions
}) {}

export class PollPublicOutput extends Struct({
	root: Field,
	nullifier: Field
}) {}

export async function canVote(
	witness: MerkleMapWitness,
	nullifier: Nullifier,
	pollId: CircuitString
): Promise<PollPublicOutput> {
	const key = Poseidon.hash(nullifier.getPublicKey().toFields());
	const [computedRoot, computedKey] = witness.computeRootAndKeyV2(
		Bool(true).toField()
	);
	computedKey.assertEquals(key);

	const message = CircuitString.toFields(pollId);
	nullifier.verify(message);

	return new PollPublicOutput({
		root: computedRoot,
		nullifier: nullifier.key()
	});
}

export const pollProgram = ZkProgram({
	name: "poll",
	publicOutput: PollPublicOutput,
	methods: {
		canVote: {
			privateInputs: [MerkleMapWitness, Nullifier, CircuitString],
			method: canVote
		}
	}
});

export class PollProof extends ZkProgram.Proof(pollProgram) {}

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
		commitment: Field,
		optionsHashes: OptionsHashes
	) {
		const checkPoll = await this.polls.get(id);
		assert(checkPoll.isSome.not(), "Poll already exists");
		await this.polls.set(
			id,
			new PollStruct({
				commitment,
				votes: VoteOptions.fromOptionsHashes(optionsHashes)
			})
		);
	}

	@runtimeMethod()
	async vote(id: CircuitString, optionHash: Field, proof: PollProof) {
		/*
			NOTE: This proof verification was based on private-airdrop-workshop repo, but it has
			known vulnerabilities while Protokit is in development:
			Read more: https://github.com/proto-kit/private-airdrop-workshop
		 	
			TODO: In the future, check for Protokit updates and, if necessarly,
			implement a new proof validation method
		*/

		proof.verify();

		const poll = await this.polls.get(id);

		assert(poll.isSome, "Poll does not exist");

		assert(
			proof.publicOutput.root.equals(poll.value.commitment),
			"Poll proof does not contain the correct commitment"
		);

		const isNullifierUsed = await this.nullifiers.get(
			proof.publicOutput.nullifier
		);

		assert(isNullifierUsed.value.not(), "Nullifier has already been used");

		await this.nullifiers.set(proof.publicOutput.nullifier, Bool(true));

		const currentVotes = await poll.value.votes;

		await this.polls.set(
			id,
			new PollStruct({
				commitment: poll.value.commitment,
				votes: VoteOptions.cast(currentVotes, optionHash)
			})
		);
	}
}
