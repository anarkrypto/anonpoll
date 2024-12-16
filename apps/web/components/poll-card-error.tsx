import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

interface PollCardErrorProps {
	title: string
	description?: string
	onRetry?: () => void
}

export function PollCardError({
	title,
	description,
	onRetry,
}: PollCardErrorProps) {
	return (
		<Card className="w-full max-w-xl p-4">
			<CardHeader className="flex-row items-center gap-4 text-red-600">
				<AlertCircle className="h-6 w-6" />
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{description && (
					<p className="text-sm text-muted-foreground">{description}</p>
				)}
			</CardContent>
			<CardFooter>
				{onRetry && (
					<Button variant="outline" onClick={onRetry}>
						Try Again
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
