'use client';

import { Shield, Lock, CheckSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/feature-card';
import Link from 'next/link';

export default function LandingPage() {
	return (
		<main className="mx-auto flex max-w-7xl flex-1 flex-col gap-12 p-4 sm:p-6 lg:px-8">
			{/* Hero Section */}
			<section className="flex flex-1 flex-col items-center justify-center text-center">
				<h1 className="mb-4 animate-fade-in text-3xl font-bold text-zinc-700 md:text-4xl lg:text-5xl">
					A Private Voting System
					<span className="block">
						Powered by{' '}
						<span className="animate-fade-in text-primary">
							Zero-Knowledge Proofs
						</span>
					</span>
				</h1>
				<p className="mx-auto mb-8 max-w-2xl animate-slide-up text-xl text-zinc-600">
					Create polls, cast votes and verify results anonymously.
				</p>
				<Link href="/new">
					<Button className="button-3d rounded-lg bg-primary px-8 py-6 text-lg text-white hover:bg-primary/90">
						Create a New Poll <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</Link>
			</section>

			{/* Features Section */}
			<section className="grid grid-cols-1 gap-8 md:grid-cols-3">
				<FeatureCard
					Icon={Shield}
					title="Secure"
					description="Your vote is protected by state-of-the-art cryptography."
					className="animate-fade-in opacity-0"
					style={{
						animationDelay: '.2s',
						animationDuration: '1.2s',
					}}
				/>
				<FeatureCard
					Icon={Lock}
					title="Private"
					description="Your identity remains anonymous throught the voting process."
					className="animate-fade-in opacity-0"
					style={{
						animationDelay: '.6s',
						animationDuration: '1.2s',
					}}
				/>
				<FeatureCard
					Icon={CheckSquare}
					title="Verifiable"
					description="Ensure the integrity of the voting results without compromising privacy."
					className="animate-fade-in opacity-0"
					style={{
						animationDelay: '1s',
						animationDuration: '1.2s',
					}}
				/>
			</section>

			{/* Made with by Section */}
			<section className="flex flex-1 flex-col items-center justify-center">
				<h3 className="mb-2 text-center text-base text-zinc-400">Made with</h3>
				<div className="align-center grid w-fit grid-cols-2 flex-row flex-wrap items-center justify-center gap-y-6 md:grid-cols-4">
					{madeWithList.map((item, index) => (
						<a href={item.url} target="_blank" key={index} className="px-6">
							<img
								alt={item.name}
								className="mx-auto w-auto text-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
								src={item.icon}
								style={{
									height: item.height,
								}}
							/>
						</a>
					))}
				</div>
			</section>
		</main>
	);
}

const madeWithList = [
	{
		name: 'Mina Protocol',
		url: 'https://minaprotocol.com',
		icon: '/assets/mina.svg',
		height: 28,
	},
	{
		name: 'Protokit',
		url: 'https://protokit.dev',
		icon: '/assets/protokit.svg',
		height: 28,
	},
	{
		name: 'o1js',
		url: 'https://docs.minaprotocol.com/zkapps/o1js',
		icon: '/assets/o1js.svg',
		height: 40,
	},
	{
		name: 'IPFS',
		url: 'https://ipfs.tech',
		icon: '/assets/ipfs.png',
		height: 28,
	},
];
