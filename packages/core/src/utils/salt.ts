export const generateSalt = () => {
	const random = new Uint8Array(16);
	crypto.getRandomValues(random);
	return Array.from(random)
		.map(x => x.toString(16).padStart(2, '0'))
		.join('');
};
