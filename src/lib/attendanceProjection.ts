export type AttendanceProjection =
	| { status: "safe"; message: string }
	| { status: "warning"; message: string };

export function calculateAttendanceProjection(
	present: number,
	total: number,
	targetPercentage: number,
): AttendanceProjection {
	if (total === 0) {
		return { status: "safe", message: "No classes held yet." };
	}
	const target = targetPercentage / 100;
	const currentPercentage = (present / total) * 100;

	if (currentPercentage >= targetPercentage) {
		const canMiss = Math.floor((present - target * total) / target);
		return {
			status: "safe",
			message:
				canMiss > 0
					? `You can miss ${canMiss} class${canMiss === 1 ? "" : "es"} only`
					: "Try not to miss any more classes",
		};
	}
	const needToAttend = Math.ceil((target * total - present) / (1 - target));
	return {
		status: "warning",
		message: `Need to attend next ${needToAttend} class${needToAttend === 1 ? "" : "es"}`,
	};
}
