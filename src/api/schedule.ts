import axios from "axios";
import type { ScheduleEntry, ScheduleResponse } from "../types/response";
import { authHeaders, getBaseUrl } from "./client";

function formatDate(date: Date): string {
	return date.toISOString().split("T")[0];
}

function removeDuplicateEntries(schedule: ScheduleEntry[]): ScheduleEntry[] {
	const seen = new Set<string>();
	return schedule.filter((entry) => {
		if (!entry.lectureDate) return false;
		const key = `${entry.courseCode}-${entry.lectureDate}-${entry.start}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export async function fetchScheduleClasses(
	token: string,
	start: Date,
	end: Date,
): Promise<ScheduleEntry[]> {
	const response = await axios.get<ScheduleResponse>(
		`${getBaseUrl()}/api/student/schedule/class`,
		{
			params: {
				weekStartDate: formatDate(start),
				weekEndDate: formatDate(end),
			},
			headers: authHeaders(token),
		},
	);
	return removeDuplicateEntries(response.data.data ?? []);
}

export function getWeekRange(): { startDate: Date; endDate: Date } {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const dayOfWeek = today.getDay();

	const startDate = new Date(today);
	startDate.setDate(today.getDate() - dayOfWeek);

	const endDate = new Date(startDate);
	endDate.setDate(startDate.getDate() + 6);

	return { startDate, endDate };
}
