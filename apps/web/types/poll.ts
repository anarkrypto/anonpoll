export interface PollData {
  id: number;
  title: string;
  description: string;
  options: string[];
  creatorWallet: string;
  votersWallets: string[];
  createdAt: Date;
}
