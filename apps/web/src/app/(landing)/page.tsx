'use client';

import { Shield, Lock, CheckSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/feature-card';
import Link from 'next/link';

export default function LandingPage() {
	return (
		<main className="flex flex-1 flex-col justify-center">
			{/* Hero Section */}
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<h1 className="animate-fade-in mb-4 text-3xl font-bold text-zinc-700 md:text-4xl lg:text-5xl">
						A Private Voting System
						<span className="block">
							Powered by{' '}
							<span className="text-primary">Zero-Knowledge Proofs</span>
						</span>
					</h1>
					<p className="mx-auto mb-8 max-w-2xl text-xl text-zinc-600">
						Experience the future of voting with zero-knowledge proof
						technology. Create polls, cast votes, and verify results
						anonymously.
					</p>
					<Link href="/new">
						<Button className="button-3d rounded-lg bg-primary px-8 py-6 text-lg text-white hover:bg-primary/90">
							Create a New Poll <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</div>

				{/* Features Section */}
				<div className="mt-10 grid grid-cols-1 gap-8 sm:mt-20 md:grid-cols-3">
					<FeatureCard
						Icon={Shield}
						title="Secure"
						description="Your vote is protected by state-of-the-art cryptography."
					/>
					<FeatureCard
						Icon={Lock}
						title="Private"
						description="Your identity remains anonymous throughout the voting process."
					/>
					<FeatureCard
						Icon={CheckSquare}
						title="Verifiable"
						description="Ensure the integrity of the voting results without compromising privacy."
					/>
				</div>
			</div>
		</main>
	);
}
