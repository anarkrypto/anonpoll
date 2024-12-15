import * as React from 'react'

import { cn } from '@/lib/cn'

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	invalid?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, invalid = false, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-primary/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-50',
					className,
					invalid &&
						'focus-visible:border-desctructive border-destructive focus-visible:ring-destructive'
				)}
				ref={ref}
				{...props}
			/>
		)
	}
)
Input.displayName = 'Input'

export { Input }
