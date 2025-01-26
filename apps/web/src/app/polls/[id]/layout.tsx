import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Poll',
};

export default function PollLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div>
			<div className="flex flex-1 flex-col items-center justify-center px-4">
				<Alert className="mx-auto mb-4 w-full max-w-xl border-yellow-500 text-yellow-700">
					<AlertTriangleIcon className="h-4 w-4 !text-yellow-700" />
					<AlertTitle>Experimental Poll</AlertTitle>
					<AlertDescription>
						This app is in alpha and may be insecure. It&apos;s not ready for
						real use cases.
					</AlertDescription>
				</Alert>
				{children}
			</div>
		</div>
	);
}
