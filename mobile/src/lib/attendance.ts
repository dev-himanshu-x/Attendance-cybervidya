import type { DayRecord } from "@/data/sample";

export function percentage(present: number, total: number): number {
	return total === 0 ? 0 : (present / total) * 100;
}

export type Projection =
	| { status: "empty" }
	| { status: "safe"; canMiss: number }
	| { status: "warning"; needToAttend: number };

// Same maths as the web app's attendance projection.
export function projectAttendance(
	present: number,
	total: number,
	targetPercentage: number,
): Projection {
	if (total === 0) return { status: "empty" };
	const target = targetPercentage / 100;
	if (percentage(present, total) >= targetPercentage) {
		return {
			status: "safe",
			canMiss: Math.max(0, Math.floor((present - target * total) / target)),
		};
	}
	return {
		status: "warning",
		needToAttend: Math.ceil((target * total - present) / (1 - target)),
	};
}

export type DayStatus = "full" | "partial" | "missed" | "today" | "upcoming";

export function dayStatus(
	day: DayRecord,
	index: number,
	todayIndex: number,
): DayStatus {
	if (index === todayIndex) return "today";
	if (index > todayIndex || day.held === 0) return "upcoming";
	if (day.attended >= day.held) return "full";
	return day.attended === 0 ? "missed" : "partial";
}

export function weekTotals(week: DayRecord[]) {
	return week.reduce(
		(sum, d) => ({
			held: sum.held + d.held,
			attended: sum.attended + d.attended,
			scheduled: sum.scheduled + d.scheduled,
		}),
		{ held: 0, attended: 0, scheduled: 0 },
	);
}

export function describeProjection(projection: Projection): string {
	switch (projection.status) {
		case "empty":
			return "No classes held yet.";
		case "safe":
			return projection.canMiss > 0
				? `Can miss ${projection.canMiss} class${projection.canMiss === 1 ? "" : "es"}`
				: "On target · don't miss any";
		case "warning":
			return `Attend next ${projection.needToAttend} class${projection.needToAttend === 1 ? "" : "es"}`;
	}
}
