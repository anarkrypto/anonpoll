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
import { SITE_URL } from './config';

export const metadata: Metadata = {
	title: {
		default: 'ZeroPoll',
		template: '%s | ZeroPoll',
	},
	description: 'A private voting system powered by zero-knowledge proofs',
	applicationName: 'ZeroPoll',
	authors: {
		url: 'https://github.com/anarkrypto',
		name: 'anarkrypto',
	},
	category: 'Voting',
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	alternates: {
		canonical: `${SITE_URL}/`,
		languages: {
			'en-US': `${SITE_URL}/`,
		},
	},
	metadataBase: new URL(SITE_URL),
};

export const fontSans = FontSans({
	subsets: ['latin'],
	variable: '--font-sans',
	weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="h-full">
			<body
				className={cn(
					'flex min-h-screen flex-col font-sans antialiased',
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
