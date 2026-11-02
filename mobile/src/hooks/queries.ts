import { useQuery } from "@tanstack/react-query";
import {
	type CourseAttendancePayload,
	fetchAttendanceData,
	fetchCourseAttendance,
	fetchSchedule,
	fetchStudentId,
} from "@/api/attendance";
import { isBlockedStatus } from "@/api/http";
import { addDays, toDateKey, weekStart } from "@/lib/dates";
import type { LectureListProps, StudentDetails } from "@/types/response";

export function useAttendance(token: string) {
	return useQuery({
		queryKey: ["attendance", token],
		queryFn: () => fetchAttendanceData(token),
		staleTime: 60_000,
	});
}

export function useStudentId(token: string) {
	return useQuery({
		queryKey: ["studentId", token],
		queryFn: () => fetchStudentId(token),
		staleTime: Number.POSITIVE_INFINITY,
	});
}

// Monday–Saturday of the current week.
export function useWeekSchedule(token: string) {
	const start = weekStart(new Date());
	const startKey = toDateKey(start);
	return useQuery({
		queryKey: ["schedule", token, startKey],
		queryFn: () => fetchSchedule(token, startKey, toDateKey(addDays(start, 5))),
		staleTime: 5 * 60_000,
	});
}

export function useCourseLectures(
	token: string,
	payload: CourseAttendancePayload | null,
) {
	return useQuery({
		queryKey: ["courseLectures", token, payload],
		queryFn: async () => {
			const data = await fetchCourseAttendance(
				token,
				payload as CourseAttendancePayload,
			);
			return data[0]?.lectureList ?? [];
		},
		enabled: payload !== null,
		staleTime: 5 * 60_000,
	});
}

export interface CourseDay {
	courseCode: string;
	courseName: string;
	componentName: string;
	timeSlot: string;
	attendance: LectureListProps["attendance"];
}
export type DayMap = Record<string, CourseDay[]>;

// Space the per-course requests out so a student with many courses doesn't
// look like a burst of automated traffic to the ERP's abuse detection — a
// burst is what previously got a real account blocked.
const REQUEST_SPACING_MS = 300;

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Every lecture of every course, keyed by date. One sequential pass per app
// session; it stops outright if the server starts refusing.
export function useLectureHistory(
	token: string,
	studentId: number | null | undefined,
	attendance: StudentDetails | undefined,
) {
	const courses = attendance?.attendanceCourseComponentInfoList ?? [];
	const componentIds = courses
		.flatMap((course) =>
			course.attendanceCourseComponentNameInfoList.map(
				(c) => c.courseComponentId,
			),
		)
		.sort((a, b) => a - b);

	return useQuery({
		queryKey: ["lectureHistory", token, studentId, componentIds],
		enabled: !!studentId && courses.length > 0,
		staleTime: Number.POSITIVE_INFINITY,
		queryFn: async (): Promise<DayMap> => {
			const requests = courses.flatMap((course) =>
				course.attendanceCourseComponentNameInfoList.map((component) => ({
					course,
					componentName: component.componentName,
					payload: {
						courseCompId: component.courseComponentId,
						courseId: course.courseId,
						sessionId: null,
						studentId: studentId as number,
					},
				})),
			);

			const dayMap: DayMap = {};
			for (let i = 0; i < requests.length; i++) {
				const { course, componentName, payload } = requests[i];
				try {
					const data = await fetchCourseAttendance(token, payload);
					for (const lecture of data[0]?.lectureList ?? []) {
						const key = toDateKey(lecture.planLecDate);
						if (!dayMap[key]) dayMap[key] = [];
						dayMap[key].push({
							courseCode: course.courseCode,
							courseName: course.courseName,
							componentName,
							timeSlot: lecture.timeSlot,
							attendance: lecture.attendance,
						});
					}
				} catch (err) {
					// Refused outright: stop, and surface the error.
					if (isBlockedStatus(err)) throw err;
					// Otherwise skip — some courses have no classes yet.
				}
				if (i < requests.length - 1) await sleep(REQUEST_SPACING_MS);
			}
			return dayMap;
		},
	});
}

// Timetable for an arbitrary date range (used by the planner).
export function useRangeSchedule(
	token: string,
	startKey: string,
	endKey: string,
	enabled = true,
) {
	return useQuery({
		queryKey: ["schedule", token, startKey, endKey],
		queryFn: () => fetchSchedule(token, startKey, endKey),
		staleTime: 5 * 60_000,
		enabled,
	});
}
