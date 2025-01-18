import './globals.css';
import '@zeropoll/react-ui/styles.css';
import { Ubuntu_Sans as FontSans } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/cn';
import { ZeroPollProvider } from '@zeropoll/react';
import { TransactionNotifications } from '@/components/transaction-notifications';
import { Metadata } from 'next';
import { Footer } from '@/components/footer';

export const fontSans = FontSans({
	subsets: ['latin'],
	variable: '--font-sans',
	weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
	title: {
		default: 'ZeroPoll',
		template: '%s | ZeroPoll',
	},
	description: 'A private voting system powered by zero-knowledge proofs',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="h-full bg-primary/5">
			<body
				className={cn(
					'flex min-h-screen flex-col bg-gradient-to-b from-background to-primary/5 font-sans antialiased',
					fontSans.className
				)}
			>
				<ZeroPollProvider
					protokitGraphqlUrl={process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL!}
					ipfsApiUrl={process.env.NEXT_PUBLIC_IPFS_API_URL!}
				>
					<Navbar />
					<div className="my-10 flex flex-1 flex-col">{children}</div>
					<Footer />
					<Toaster />
					<TransactionNotifications />
				</ZeroPollProvider>
			</body>
		</html>
	);
}
