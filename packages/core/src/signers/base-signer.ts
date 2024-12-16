import { Nullifier } from 'o1js'
import { z } from 'zod'
export abstract class MinaSignerAbstract {
	abstract requestAccount: () => Promise<string>
	abstract getAccount: () => Promise<string | null>
	abstract on: (event: 'accountsChanged', handler: (event: any) => void) => void
	abstract createNullifier: ({
		message,
	}: {
		message: number[]
	}) => Promise<Nullifier>
	abstract signJsonMessage: ({
		message,
	}: {
		message: { label: string; value: string }[]
	}) => Promise<{
		data: string
		publicKey: string
		signature: { field: string; scalar: string }
	}>
}

export class MinaSignerError extends Error {
	code: number
	data: unknown

	constructor(message: string, code: number, data?: unknown) {
		super(message)
		this.name = 'MinaError'
		this.code = code
		this.data = data
	}

	static fromJson(json: any) {
		const { success, data } = z
			.object({
				message: z.string(),
				code: z.number(),
				data: z.any(),
			})
			.safeParse(json)
		if (success) {
			return new MinaSignerError(data.message, data.code, data.data)
		} else {
			return new MinaSignerError('Unknown error', 0)
		}
	}
}
