export const formatSeconds = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const secondsLeft = seconds % 60;
	return `${minutes}:${secondsLeft.toString().padStart(2, '0')}`;
};
