'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Lock, Vote } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
	subsets: ['latin'],
	weight: ['600', '700'],
});

export default function LandingPage() {
	return (
		<div className="mt-4 flex flex-1 flex-col items-center justify-center p-4 sm:mt-0">
			<main className="w-full max-w-4xl space-y-8">
				<div className="space-y-4">
					<h1
						className={cn(
							montserrat.className,
							'text-center text-4xl sm:text-5xl md:text-6xl'
						)}
					>
						<span className="bg-gradient-to-b from-zinc-600 to-zinc-800 bg-clip-text font-semibold text-transparent">
							Zero
						</span>
						<span className="bg-gradient-to-b from-violet-500 to-violet-700 bg-clip-text font-bold text-transparent">
							Poll
						</span>
					</h1>
					<p className="text-md text-center text-gray-600 sm:text-lg md:text-xl">
						A private voting system powered by zero-knowledge proofs
					</p>
				</div>

				<div className="grid justify-center gap-3 md:grid-cols-3 lg:gap-6">
					<FeatureCard
						icon={<Shield className="h-8 w-8 text-blue-500" />}
						title="Secure"
						description="Your vote is protected by state-of-the-art cryptography"
					/>
					<FeatureCard
						icon={<Lock className="h-8 w-8 text-green-500" />}
						title="Private"
						description="Your identity remains anonymous throughout the voting process"
					/>
					<FeatureCard
						icon={<Vote className="h-8 w-8 text-violet-500" />}
						title="Verifiable"
						description="Ensure the integrity of the voting results without compromising privacy"
					/>
				</div>

				<div className="flex justify-center">
					<Link href="/new" passHref>
						<Button size="lg" className="px-8 py-6 text-lg">
							Create a New Poll
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</Link>
				</div>

				<div>
					<p className="text-center text-gray-600">
						Experience the future of voting with our cutting-edge zero-knowledge
						proof technology.
					</p>
					<p className="text-center text-gray-600">
						Create polls, cast votes, and verify results - all while maintaining
						anonymity.
					</p>
				</div>
			</main>

			<footer className="mt-16 flex w-full justify-center gap-4 text-sm text-gray-600">
				<span>© 2024 ZeroPoll</span>
				<span className="text-gray-300">|</span>
				<a
					href="https://github.com/anarkrypto/zeropoll"
					target="_blank"
					className="flex items-center gap-1.5 hover:text-violet-600"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
					</svg>
					Source Code
				</a>
			</footer>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex max-w-xl flex-col items-center space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-center">
			{icon}
			<h3 className="text-lg font-semibold">{title}</h3>
			<p className="text-sm text-gray-600">{description}</p>
		</div>
	);
}
