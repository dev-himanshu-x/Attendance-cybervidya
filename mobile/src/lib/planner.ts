import { percentage, projectAttendance } from "@/lib/attendance";
import {
	addDays,
	classStartTime,
	formatShortTime,
	toLectureDateString,
} from "@/lib/dates";
import type { ScheduleEntry, StudentDetails } from "@/types/response";

export type PlannerClass = ScheduleEntry & {
	key: string;
	startsAt: Date;
	formattedStart: string;
	formattedEnd: string;
};

export function toPlannerClass(entry: ScheduleEntry): PlannerClass {
	return {
		...entry,
		key: `${entry.courseCode}-${entry.lectureDate}-${entry.start}`,
		startsAt: classStartTime(entry.lectureDate as string, entry.start),
		formattedStart: formatShortTime(entry.start),
		formattedEnd: formatShortTime(entry.end),
	};
}

// When the ERP has no timetable for a range (e.g. a future holiday), project
// the regular weekly timetable onto each date so the planner still has
// something to show.
export function projectTemplateOntoRange(
	weeklyTemplate: ScheduleEntry[],
	start: Date,
	end: Date,
): ScheduleEntry[] {
	const byWeekday = new Map<number, ScheduleEntry[]>();
	for (const entry of weeklyTemplate) {
		if (entry.type !== "CLASS" || !entry.lectureDate) continue;
		const [day, month, year] = entry.lectureDate.split("/").map(Number);
		const weekday = new Date(year, month - 1, day).getDay();
		byWeekday.set(weekday, [...(byWeekday.get(weekday) ?? []), entry]);
	}

	const projected: ScheduleEntry[] = [];
	for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
		const lectureDate = toLectureDateString(cursor);
		for (const entry of byWeekday.get(cursor.getDay()) ?? []) {
			const startTime = entry.start.split(" ")[1] ?? entry.start;
			const endTime = entry.end.split(" ")[1] ?? entry.end;
			projected.push({
				...entry,
				lectureDate,
				start: `${lectureDate} ${startTime}`,
				end: `${lectureDate} ${endTime}`,
			});
		}
	}
	return projected;
}

interface CourseEffect {
	courseCode: string;
	courseName: string;
	skipped: number;
	before: number;
	after: number;
}

// What the overall (and per-course) attendance becomes if the given classes
// are skipped: each skipped class adds one period without adding a present.
export function simulateSkips(
	attendance: StudentDetails,
	skippedCourseCodes: string[],
	target: number,
) {
	const skipsByCourse = new Map<string, number>();
	for (const code of skippedCourseCodes) {
		skipsByCourse.set(code, (skipsByCourse.get(code) ?? 0) + 1);
	}

	let held = 0;
	let present = 0;
	const effects: CourseEffect[] = [];
	for (const course of attendance.attendanceCourseComponentInfoList) {
		const component = course.attendanceCourseComponentNameInfoList[0];
		if (!component) continue;
		const courseHeld = component.numberOfPeriods;
		const coursePresent =
			component.numberOfExtraAttendance + component.numberOfPresent;
		const skipped = skipsByCourse.get(course.courseCode) ?? 0;
		held += courseHeld + skipped;
		present += coursePresent;
		if (skipped > 0) {
			effects.push({
				courseCode: course.courseCode,
				courseName: course.courseName,
				skipped,
				before: percentage(coursePresent, courseHeld),
				after: percentage(coursePresent, courseHeld + skipped),
			});
		}
	}

	return {
		percent: percentage(present, held),
		projection: projectAttendance(present, held, target),
		effects,
	};
}
