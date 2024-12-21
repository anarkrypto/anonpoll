'use client';

import { Controllers } from '@zeropoll/core';
import { useZeroPoll } from '../zeropoll-provider';

export const useControllers = (): Controllers => {
	const { zeroPoll } = useZeroPoll();
	return zeroPoll.context;
};
