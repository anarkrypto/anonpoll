import { PollData } from '@/types/poll';

export abstract class PollRepository {
  abstract createPoll(poll: PollData): Promise<void>;
  abstract getPoll(pollId: number): Promise<PollData | null>;
  abstract getPollsByUser(wallet: string): Promise<PollData[]>;
}