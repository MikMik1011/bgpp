import { json } from '@sveltejs/kit';
import { getCities } from '$lib/server/cities';

export const GET = () => {
	const cities = getCities();
	
	return json(getCities());
};