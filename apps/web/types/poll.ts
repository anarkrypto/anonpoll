export interface PollData {
  id: number;
  title: string;
  description: string | null;
  options: string[];
  creatorWallet: string;
  votersWallets: string[];
  createdAt: Date;
}
