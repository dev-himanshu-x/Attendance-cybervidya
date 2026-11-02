import type { DayRecord, HomeData } from "@/data/sample";
import type { DayMap } from "@/hooks/queries";
import { addDays, parseLectureDate, toDateKey, weekStart } from "@/lib/dates";
import type { ScheduleEntry, StudentDetails } from "@/types/response";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function overallTotals(attendance: StudentDetails) {
	let held = 0;
	let present = 0;
	// Same as the website: the first component of each course.
	for (const course of attendance.attendanceCourseComponentInfoList) {
		const component = course.attendanceCourseComponentNameInfoList[0];
		if (!component) continue;
		held += component.numberOfPeriods;
		present += component.numberOfExtraAttendance + component.numberOfPresent;
	}
	return { present, held };
}

function isPresent(attendance: string): boolean {
	return attendance === "PRESENT" || attendance === "ADJUSTED";
}

// Days (oldest first) that had classes, with whether any class was missed.
function streaks(dayMap: DayMap, today: string) {
	const days = Object.keys(dayMap)
		.filter((key) => key <= today && dayMap[key].length > 0)
		.sort();
	let run = 0;
	let best = 0;
	for (const key of days) {
		run = dayMap[key].some((c) => !isPresent(c.attendance)) ? 0 : run + 1;
		best = Math.max(best, run);
	}
	return { current: run, best };
}

function buildWeek(
	now: Date,
	dayMap: DayMap,
	schedule: ScheduleEntry[],
): { week: DayRecord[]; todayIndex: number } {
	const monday = weekStart(now);
	const week = WEEKDAYS.map((label, i): DayRecord => {
		const key = toDateKey(addDays(monday, i));
		const lectures = dayMap[key] ?? [];
		const timetabled = schedule.filter(
			(entry) =>
				entry.type === "CLASS" && parseLectureDate(entry.lectureDate) === key,
		).length;
		return {
			label,
			held: lectures.length,
			attended: lectures.filter((c) => isPresent(c.attendance)).length,
			scheduled: Math.max(timetabled, lectures.length),
		};
	});
	const weekday = now.getDay();
	// Sunday: the Mon–Sat week is over, so nothing is "today".
	const todayIndex = weekday === 0 ? WEEKDAYS.length : weekday - 1;
	return { week, todayIndex };
}

export function buildHomeData(
	attendance: StudentDetails,
	dayMap: DayMap,
	schedule: ScheduleEntry[],
	targetPercentage: number,
	now = new Date(),
): HomeData {
	const today = toDateKey(now);
	const { present, held } = overallTotals(attendance);
	const { week, todayIndex } = buildWeek(now, dayMap, schedule);
	const { current, best } = streaks(dayMap, today);
	return {
		studentName: attendance.fullName,
		today,
		todayIndex,
		week,
		totalPresent: present,
		totalHeld: held,
		targetPercentage,
		streakDays: current,
		bestStreak: best,
	};
}
