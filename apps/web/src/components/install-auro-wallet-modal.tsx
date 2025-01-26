import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLinkIcon } from 'lucide-react';
import { DialogProps } from '@radix-ui/react-dialog';
import Link from 'next/link';

export default function InstallAuroWalletModal(props: DialogProps) {
	return (
		<Dialog modal {...props}>
			<DialogContent className="bg-white text-zinc-800 sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-zinc-700">
						Install <span className="text-primary">Auro Wallet</span>
					</DialogTitle>
					<DialogDescription className="text-zinc-700">
						To interact with this site, you need to install the Auro Wallet
						browser extension.
					</DialogDescription>
				</DialogHeader>
				<div className="pb-4">
					<p className="mb-2 text-sm text-zinc-700">
						Auro Wallet is a secure and user-friendly wallet for MINA Protocol.
						It allows you to:
					</p>
					<ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
						<li>Manage your MINA tokens</li>
						<li>Interact with MINA-based applications</li>
						<li>Sign transactions securely</li>
					</ul>
				</div>
				<DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
					<Button
						variant="outline"
						onClick={() => props.onOpenChange?.(false)}
						className="w-full border-primary/20 text-primary hover:bg-primary/20 hover:text-primary sm:w-auto"
					>
						Close
					</Button>
					<Button className="w-full sm:w-auto" asChild>
						<Link href="https://www.aurowallet.com" target="_blank">
							Install Now
							<ExternalLinkIcon className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
