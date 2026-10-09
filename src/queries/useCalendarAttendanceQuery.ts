import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { fetchCourseAttendance } from "../api/attendance";
import type { LectureListProps, StudentDetails } from "../types/response";

export interface CourseDay {
	courseCode: string;
	courseName: string;
	componentName: string;
	timeSlot: string;
	attendance: LectureListProps["attendance"];
}

export type DayMap = Record<string, CourseDay[]>;

// Space out the sequential per-course requests below so a student with many
// enrolled courses doesn't look like a burst of automated traffic to the
// ERP's abuse detection — this is what previously got a real account
// blocked for "illegal access attempts".
const REQUEST_SPACING_MS = 300;
const SESSION_CACHE_PREFIX = "calendarAttendance:";

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBlockedResponse(err: unknown): boolean {
	if (!axios.isAxiosError(err)) return false;
	const status = err.response?.status;
	return status === 401 || status === 403 || status === 429;
}

function readSessionCache(key: string): DayMap | null {
	try {
		const raw = sessionStorage.getItem(key);
		return raw ? (JSON.parse(raw) as DayMap) : null;
	} catch {
		return null;
	}
}

function writeSessionCache(key: string, dayMap: DayMap) {
	try {
		sessionStorage.setItem(key, JSON.stringify(dayMap));
	} catch {
		// Storage full or unavailable (e.g. private browsing) — not fatal.
	}
}

export function toDateKey(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Fetches per-course attendance sequentially (one request at a time, spaced
 * out, to avoid hammering the server) and aggregates it into a date-keyed
 * map. `staleTime: Infinity` plus a sessionStorage-backed cache keeps this a
 * one-shot fetch per browser session, even across page reloads.
 *
 * `courseCodeFilter`, when given, restricts the fetch to only the listed
 * course codes (e.g. just today's scheduled courses) instead of the
 * student's entire course list — callers that only need a small slice of
 * this data (like today's attendance badges) should narrow it down rather
 * than pulling the whole semester's history just to read a few rows.
 */
export function useCalendarAttendanceQuery(
	token: string | null,
	studentId: number | null,
	attendanceData: StudentDetails | null,
	courseCodeFilter?: Set<string>,
) {
	const courses = (
		attendanceData?.attendanceCourseComponentInfoList ?? []
	).filter(
		(course) => !courseCodeFilter || courseCodeFilter.has(course.courseCode),
	);
	const courseComponentIds = courses
		.flatMap((course) =>
			course.attendanceCourseComponentNameInfoList.map(
				(component) => component.courseComponentId,
			),
		)
		.sort((a, b) => a - b);

	return useQuery({
		queryKey: ["calendarAttendance", token, studentId, courseComponentIds],
		queryFn: async (): Promise<DayMap> => {
			if (!attendanceData || !token || !studentId) return {};
			if (courseComponentIds.length === 0) return {};

			const cacheKey = `${SESSION_CACHE_PREFIX}${studentId}:${courseComponentIds.join(",")}`;
			const cached = readSessionCache(cacheKey);
			if (cached) return cached;

			const requests = courses.flatMap((course) =>
				course.attendanceCourseComponentNameInfoList.map((component) => ({
					courseCode: course.courseCode,
					courseName: course.courseName,
					componentName: component.componentName,
					payload: {
						courseCompId: component.courseComponentId,
						courseId: course.courseId,
						sessionId: null,
						studentId,
					},
				})),
			);

			const dayMap: DayMap = {};

			for (let i = 0; i < requests.length; i++) {
				const req = requests[i];
				try {
					const data = await fetchCourseAttendance(token, req.payload);
					if (data.length > 0) {
						for (const lecture of data[0].lectureList) {
							const key = toDateKey(lecture.planLecDate);
							if (!dayMap[key]) dayMap[key] = [];
							dayMap[key].push({
								courseCode: req.courseCode,
								courseName: req.courseName,
								componentName: req.componentName,
								timeSlot: lecture.timeSlot,
								attendance: lecture.attendance,
							});
						}
					}
				} catch (err) {
					if (isBlockedResponse(err)) {
						// The server is rejecting us outright — stop immediately
						// instead of ploughing through the remaining requests.
						break;
					}
					// Otherwise skip — some courses legitimately have no classes yet.
				}

				if (i < requests.length - 1) {
					await sleep(REQUEST_SPACING_MS);
				}
			}

			writeSessionCache(cacheKey, dayMap);
			return dayMap;
		},
		enabled: !!token && !!studentId && !!attendanceData,
		staleTime: Number.POSITIVE_INFINITY,
	});
}
