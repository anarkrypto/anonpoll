import { UInt64 } from "@proto-kit/library";
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
	ZkProgram
} from "o1js";

export class Votes extends Struct({
	yayes: UInt64,
	nays: UInt64
}) {}

export class PollPublicOutput extends Struct({
	root: Field,
	nullifier: Field
}) {}

export const message: Field[] = [Field(0)];


export async function canVote(
	witness: MerkleMapWitness,
	nullifier: Nullifier
): Promise<PollPublicOutput> {
	const key = Poseidon.hash(nullifier.getPublicKey().toFields());
	const [computedRoot, computedKey] = witness.computeRootAndKeyV2(
		Bool(true).toField()
	);
	computedKey.assertEquals(key);

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
			privateInputs: [MerkleMapWitness, Nullifier],
			method: canVote
		}
	}
});

export class PollProof extends ZkProgram.Proof(pollProgram) {}

@runtimeModule()
export class Poll extends RuntimeModule {
	@state() public commitment = State.from<Field>(Field);
    @state() public nullifiers = StateMap.from<Field, Bool>(Field, Bool);
	@state() public votes = State.from<Votes>(Votes);

	@runtimeMethod()
	public async setCommitment(commitment: Field) {
	  await this.commitment.set(commitment);
	}

	@runtimeMethod()
	async vote(
		vote: Bool,
		poolProof: PollProof
	) {
		poolProof.verify();

		const commitment = await this.commitment.get();

		assert(
			poolProof.publicOutput.root.equals(commitment.value),
			"Poll proof does not contain the correct commitment"
		);

		const isNullifierUsed = await this.nullifiers.get(
			poolProof.publicOutput.nullifier
		);

        assert(isNullifierUsed.value.not(), "Nullifier has already been used");

        await this.nullifiers.set(poolProof.publicOutput.nullifier, Bool(true));

		const currentVotes = (await this.votes.get()).orElse(new Votes({ yayes: new UInt64({value: Field(0)}), nays: new UInt64({value: Field(0)}) }));

		await this.votes.set(
			new Votes({
				yayes: new UInt64({ value: currentVotes.yayes.value.add(vote.toField()) }),
				nays: new UInt64({ value: currentVotes.nays.value.add(vote.not().toField()) })
			})
		);
	}
}
