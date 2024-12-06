import { UInt32 } from "@proto-kit/library";
import {
	runtimeModule,
	state,
	runtimeMethod,
	RuntimeModule
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import {
	Field,
	Bool,
	Struct,
	Poseidon,
	MerkleMapWitness,
	Nullifier,
	ZkProgram,
	Provable
} from "o1js";

export class VoteOption extends Struct({
	hash: Field,
	votesCount: UInt32
}) {}

export class OptionHash extends Field {
	static fromText(text: string, salt: string): Field {
		const stringToFieldArray = (str: string) =>
			Array.from(str).map((char) => Field(BigInt(char.charCodeAt(0))));

		return Poseidon.hash(
			stringToFieldArray(text).concat(stringToFieldArray(salt))
		);
	}
}

export class OptionsHashes extends Struct({
	hashes: [Field, Field, Field, Field, Field, Field, Field, Field, Field, Field] // 10 options
}) {
	// Should be excuted on the client
	static fromTexts(options: string[], salt: string) {
		return new OptionsHashes({
			// Hash options inputs using Poseidon and fill the rest with
			// indexes to make sure the hashes are unique
			hashes: Array(10)
				.fill(Field(0))
				.map((_, i) => OptionHash.fromText(options[i] || i.toString(), salt))
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

export class PollPublicOutput extends Struct({
	root: Field,
	nullifier: Field
}) {}

export async function canVote(
	witness: MerkleMapWitness,
	nullifier: Nullifier,
	pollCid: Field
): Promise<PollPublicOutput> {
	const key = Poseidon.hash(nullifier.getPublicKey().toFields());
	const [computedRoot, computedKey] = witness.computeRootAndKeyV2(
		Bool(true).toField()
	);
	computedKey.assertEquals(key);

	const message = [pollCid];
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
			privateInputs: [MerkleMapWitness, Nullifier, Field],
			method: canVote
		}
	}
});

export class PollProof extends ZkProgram.Proof(pollProgram) {}

@runtimeModule()
export class Poll extends RuntimeModule {
	@state() public commitments = StateMap.from<Field, Field>(Field, Field);
	@state() public nullifiers = StateMap.from<Field, Bool>(Field, Bool);
	@state() public votes = StateMap.from<Field, VoteOptions>(Field, VoteOptions);

	@runtimeMethod()
	public async createPoll(
		cid: Field,
		commitment: Field,
		optionsHashes: OptionsHashes
	) {
		const checkCommitment = await this.commitments.get(cid);
		assert(checkCommitment.isSome.not(), "Poll already exists");
		await this.commitments.set(cid, commitment);
		await this.votes.set(cid, VoteOptions.fromOptionsHashes(optionsHashes));
	}

	@runtimeMethod()
	async vote(cid: Field, optionHash: Field, poolProof: PollProof) {
		/*
			NOTE: This proof verification was based on private-airdrop-workshop repo, but it has
			known vulnerabilities while Protokit is in development:
			Read more: https://github.com/proto-kit/private-airdrop-workshop
		 	
			TODO: In the future, check for Protokit updates and, if necessarly,
			implement a new proof validation method
		*/

		poolProof.verify();

		const commitment = await this.commitments.get(cid);

		assert(commitment.isSome, "Poll does not exist");

		assert(
			poolProof.publicOutput.root.equals(commitment.value),
			"Poll proof does not contain the correct commitment"
		);

		const isNullifierUsed = await this.nullifiers.get(
			poolProof.publicOutput.nullifier
		);

		assert(isNullifierUsed.value.not(), "Nullifier has already been used");

		await this.nullifiers.set(poolProof.publicOutput.nullifier, Bool(true));

		const currentVotes = await this.votes.get(cid);

		await this.votes.set(
			cid,
			VoteOptions.cast(currentVotes.value, optionHash)
		);
	}
}
