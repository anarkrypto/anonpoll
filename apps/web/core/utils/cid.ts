import { CID } from 'multiformats'

export const isCID = (value: string): boolean => {
	try {
		CID.parse(value)
		return true
	} catch {
		return false
	}
}
