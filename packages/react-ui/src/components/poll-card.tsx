'use client';

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { DialogDescription, DialogProps } from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import {
	CheckIcon,
	CircleCheckBigIcon,
	CircleIcon,
	CopyCheckIcon,
	Share2Icon,
	ShieldCheckIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from './ui/badge';
import { usePoll, useVote, useWallet } from '@zeropoll/react';
import { PollCardSkeleton } from './poll-card-skeleton';
import { PollCardError } from './poll-card-error';

export type PollCardProps = {
	id: string;
	encryptionKey?: string;
	className?: string;
	onLoadSuccess?: () => void;
	onLoadError?: (message: string) => void;
	onVoteSuccess?: () => void;
	onVoteError?: (message: string) => void;
};

export function PollCard({
	id,
	encryptionKey,
	className,
	onLoadSuccess,
	onLoadError,
	onVoteSuccess,
	onVoteError,
}: PollCardProps) {
	const { account, connect } = useWallet();
	const {
		data: { metadata, options },
		isLoading,
		error,
	} = usePoll(id, {
		encryptionKey,
		onSuccess: onLoadSuccess,
		onError: onLoadError,
	});

	const {
		vote,
		isPending: isVoting,
		isSuccess: isVoted,
	} = useVote(id, {
		encryptionKey,
		onSuccess: onVoteSuccess,
		onError: onVoteError,
	});

	const [openVotersModal, setOpenVotersModal] = useState(false);
	const [activeOptionHash, setActiveOptionHash] = useState<string | null>(null);
	const [loadProgressBar, setLoadProgressBar] = useState(false);
	const [linkCopied, setLinkCopied] = useState(false);

	const winnerOption = useMemo(() => {
		// Return winner option hash.
		// If there is no vote, return null.
		// If there is a tie, return null.
		if (options.every(option => option.votesCount === 0)) {
			return null;
		}
		const maxVotesCount = Math.max(...options.map(option => option.votesCount));
		const topOptions = options.filter(
			option => option.votesCount === maxVotesCount
		);
		if (topOptions.length > 1) {
			return null;
		}
		return topOptions[0] || null;
	}, [options]);

	const handleVote = () => {
		if (!activeOptionHash) return;
		vote(activeOptionHash);
	};

	const handleSelectOption = (hash: string) => {
		if (isVoted) return;
		setActiveOptionHash(prev => (prev === hash ? null : hash));
	};

	const handleShare = () => {
		// TODO: Implement share functionality.
		navigator.clipboard.writeText(window.location.href);
		setLinkCopied(true);
		setTimeout(() => {
			setLinkCopied(false);
		}, 2000);
	};

	const canVote = !!activeOptionHash;

	useEffect(() => {
		if (isLoading || loadProgressBar) return;
		const timeout = setTimeout(() => {
			setLoadProgressBar(true);
		}, 1000);
		return () => {
			clearTimeout(timeout);
		};
	}, [isLoading, loadProgressBar]);

	if (error) {
		return <PollCardError title={'Error fetching Poll'} description={error} />;
	}

	if (isLoading || !metadata) {
		return <PollCardSkeleton />;
	}

	return (
		<>
			<Card className={cn('w-full max-w-xl sm:p-4 card-3d', className)}>
				<CardHeader>
					<CardTitle>{metadata.title}</CardTitle>
					{metadata.description?.trim() && (
						<CardDescription>{metadata!.description}</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						<ul className="flex flex-col gap-4">
							{options.map((option, index) => (
								<li key={index}>
									<Button
										size="lg"
										className={cn(
											'group relative w-full px-12 py-7 hover:border-primary/40 hover:bg-white hover:shadow-lg overflow-hidden',
											activeOptionHash === option.hash &&
												'overflow-hidden rounded-lg !border-[1.5px] !border-primary/50',
											'disabled:opacity-100'
										)}
										loading={isLoading}
										onClick={() => handleSelectOption(option.hash)}
										variant="outline"
										disabled={!account || isVoted}
									>
										<div
											className="absolute bottom-0 left-0 h-full bg-primary/20 transition-all duration-500 ease-in-out"
											style={{
												width: loadProgressBar
													? `${option.votesPercentage * 0.6}%`
													: option.votesPercentage * 0.2,
											}}
										/>
										<div className="absolute left-2 top-1/2 mr-2 -translate-y-1/2">
											{activeOptionHash === option.hash ? (
												<CheckIcon className="h-5 w-5 text-white rounded-full p-1 bg-primary" />
											) : (
												<CircleIcon className="text-zinc-400 group-hover:text-primary h-5 w-5" />
											)}
										</div>
										<div className="flex flex-1 justify-start text-base text-zinc-700">
											{option.text}
										</div>
										<div className="absolute right-2 top-1/2 -translate-y-1/2 space-x-3 flex flex-col sm:flex-row">
											<span className="font-normal text-zinc-500">
												{option.votesCount} vote{option.votesCount !== 1 && 's'}
											</span>
											<span className="font-semibold text-primary">
												{option.votesPercentage}%
											</span>
										</div>
									</Button>
								</li>
							))}
						</ul>
						{!!account && !isVoted && (
							<Button
								size="lg"
								className="w-full button-3d"
								type="submit"
								onClick={handleVote}
								disabled={!canVote}
								loading={isVoting}
							>
								Vote
							</Button>
						)}
						{!account && (
							<Button
								size="lg"
								className="w-full"
								loading={isLoading}
								onClick={connect}
							>
								Connect your Wallet
							</Button>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex gap-2">
					{!!metadata.votersWallets && (
						<Button
							className="w-full button-3d after:border-border"
							loading={isLoading}
							onClick={() => setOpenVotersModal(true)}
							variant="outline"
						>
							Eligible Voters
							<Badge className={cn('ml-2', 'bg-green-100 text-green-700')}>
								{metadata!.votersWallets?.length}
							</Badge>
						</Button>
					)}
					<Button
						className="w-full after:border-border button-3d"
						onClick={handleShare}
						variant="outline"
					>
						{linkCopied ? (
							<>
								Link Copied!
								<CopyCheckIcon className="ml-2 h-4 w-4 text-green-500" />
							</>
						) : (
							<>
								Share
								<Share2Icon className="ml-2 h-4 w-4 text-violet-500" />
							</>
						)}
					</Button>
				</CardFooter>
			</Card>
			<VotersModal
				votersWallets={metadata!.votersWallets || []}
				open={openVotersModal}
				onOpenChange={setOpenVotersModal}
			/>
		</>
	);
}

function VotersModal({
	votersWallets,
	...props
}: DialogProps & { votersWallets: string[] }) {
	return (
		<Dialog modal {...props}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>Eligible Voters Wallets</DialogTitle>
					<DialogDescription>
						View the wallets that are eligible to vote in this poll. Remember
						the votes itself are private.
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-between">
					<div className="font-semibold">
						Total Wallets: {votersWallets.length}
					</div>
					<div className="flex items-center gap-1 font-semibold text-green-700">
						<ShieldCheckIcon className="h-5 w-5" />
						Valid Proofs
					</div>
				</div>
				<ul className="flex list-disc flex-col gap-2 pl-4">
					{votersWallets.map((wallet, i) => (
						<li key={i} className="flex-1 break-words break-all text-sm">
							{wallet}
						</li>
					))}
				</ul>
			</DialogContent>
		</Dialog>
	);
}
