import { PublicKey } from 'o1js';

export const isValidPublicKey = (publicKey: string) => {
	try {
		PublicKey.fromBase58(publicKey);
		return true;
	} catch {
		return false;
	}
};
