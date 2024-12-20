/** @type {import('tailwindcss').Config} */
import { fontFamily } from 'tailwindcss/defaultTheme';

module.exports = {
	darkMode: ['class'],
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				border: 'hsl(var(--zeropoll-border))',
				input: 'hsl(var(--zeropoll-input))',
				ring: 'hsl(var(--zeropoll-ring))',
				background: 'hsl(var(--zeropoll-background))',
				foreground: 'hsl(var(--zeropoll-foreground))',
				primary: {
					DEFAULT: 'hsl(var(--zeropoll-primary))',
					foreground: 'hsl(var(--zeropoll-primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--zeropoll-secondary))',
					foreground: 'hsl(var(--zeropoll-secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--zeropoll-destructive))',
					foreground: 'hsl(var(--zeropoll-destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--zeropoll-muted))',
					foreground: 'hsl(var(--zeropoll-muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--zeropoll-accent))',
					foreground: 'hsl(var(--zeropoll-accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--zeropoll-popover))',
					foreground: 'hsl(var(--zeropoll-popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--zeropoll-card))',
					foreground: 'hsl(var(--zeropoll-card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--zeropoll-radius)',
				md: 'calc(var(--zeropoll-radius) - 2px)',
				sm: 'calc(var(--zeropoll-radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--zeropoll-radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--zeropoll-radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
			fontFamily: {
				sans: ['var(--font-sans)', ...fontFamily.sans],
			},
		},
	},
	plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
