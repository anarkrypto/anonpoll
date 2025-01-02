/*
	NOTE: The proof verification has known vulnerabilities while Protokit is in development
	and snarky is not implemented yet.
*/

import {
	runtimeModule,
	state,
	runtimeMethod,
	RuntimeModule
} from "@proto-kit/module";
import { assert, StateMap } from "@proto-kit/protocol";
import { Bool, CircuitString, Field, Struct } from "o1js";
import { OptionsHashes, VoteProof, Votes } from "./vote";

export class PollStruct extends Struct({
	votersRoot: Field,
	votes: Votes
}) {}

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
