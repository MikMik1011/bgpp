import { getCities } from '$lib/client/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const cities = await getCities(fetch);
	return { cities };
};
