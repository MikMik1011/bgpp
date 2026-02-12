import { error, json, type RequestEvent } from '@sveltejs/kit';
import { bgppService } from '../../../bgppManager';

export const GET = async ({ params, url }: RequestEvent) => {
    if (!params.city) {
        return error(400, 'City is required');
    }

    const city = params.city;
    if (!bgppService.isCitySupported(city)) {
        return error(400, `City ${city} is not supported`);
    }
    const lines = await bgppService.getLines(city);
    if (!lines) {
        return error(500, 'Failed to retrieve lines');
    }

    return json(lines);
};
