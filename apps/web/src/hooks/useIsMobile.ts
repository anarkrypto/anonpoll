import { useEffect, useState } from 'react';

declare global {
	interface Navigator {
		userAgentData?: {
			mobile: boolean;
		};
	}
}

function checkIsMobile() {
	if (navigator?.userAgentData) {
		return navigator.userAgentData.mobile;
	}

	const regex =
		/Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
	return regex.test(navigator?.userAgent);
}

export const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		setIsMobile(checkIsMobile());
	}, []);
	return { isMobile };
};
