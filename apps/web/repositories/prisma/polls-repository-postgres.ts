import { PollRepository } from "@/repositories/poll-repository";
import { PollData } from "@/types/poll";
import { PrismaClient } from '@prisma/client'

export class PollsRepositoryPostgres extends PollRepository {
    constructor(private readonly prisma: PrismaClient) {
      super();
    }
  
    async createPoll(poll: PollData): Promise<void> {
      await this.prisma.poll.create({
        data: {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          options: poll.options,
          votersWallets: poll.votersWallets,
          createdAt: poll.createdAt,
          creatorWallet: poll.creatorWallet,
        },
      });
    }
  
    async getPoll(pollId: number): Promise<PollData | null> {
      const poll = await this.prisma.poll.findUnique({
        where: {
          id: pollId,
        },
      });
  
      if (!poll) {
       return null
      }
  
      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        votersWallets: poll.votersWallets,
        createdAt: poll.createdAt,
        creatorWallet: poll.creatorWallet,
      };
    }
  
    async getPollsByUser(wallet: string): Promise<PollData[]> {
      const polls = await this.prisma.poll.findMany({
        where: {
          creatorWallet: wallet,
        },
      });
      return polls.map((poll: PollData) => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        votersWallets: poll.votersWallets,
        createdAt: poll.createdAt,
        creatorWallet: poll.creatorWallet,
      }));
    }
  }
  