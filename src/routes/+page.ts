import { getCities } from '$lib/bgpp/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const cities = await getCities(fetch);
	return { cities };
};
