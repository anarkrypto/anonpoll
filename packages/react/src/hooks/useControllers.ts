'use client';

import { Controllers } from '@zeropoll/core';
import { useZeroPoll } from '../engine-context';

export const useControllers = (): Controllers => {
	const { zeroPoll } = useZeroPoll();
	return zeroPoll.context;
};
