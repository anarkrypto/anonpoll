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
	ZkProgram
} from "o1js";

export class Votes extends Struct({
	yayes: UInt32,
	nays: UInt32
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
	@state() public commitments = StateMap.from<UInt32, Field>(UInt32, Field);
    @state() public nullifiers = StateMap.from<Field, Bool>(Field, Bool);
	@state() public votes = StateMap.from<UInt32, Votes>(UInt32, Votes);
	@state() public lastPollId = State.from<UInt32>(UInt32);

	@runtimeMethod()
	public async createPoll(commitment: Field) {
	  const lastId = (await this.lastPollId.get()).orElse(UInt32.from(0));
	  const newId = UInt32.Unsafe.fromField(lastId.add(1).value);
	  await this.commitments.set(newId, commitment);
	  await this.lastPollId.set(newId);
	}

	@runtimeMethod()
	async vote(
		pollId: UInt32,
		vote: Bool,
		poolProof: PollProof
	) {
		poolProof.verify();

		const commitment = await this.commitments.get(pollId);

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

		const currentVotes = (await this.votes.get(pollId)).orElse(new Votes({ yayes: new UInt32({value: Field(0)}), nays: new UInt32({value: Field(0)}) }));

		await this.votes.set(
			pollId,
			new Votes({
				yayes: UInt32.Unsafe.fromField(currentVotes.yayes.value.add(vote.toField())),
				nays: UInt32.Unsafe.fromField(currentVotes.nays.value.add(vote.not().toField()))
			})
		);
	}
}
