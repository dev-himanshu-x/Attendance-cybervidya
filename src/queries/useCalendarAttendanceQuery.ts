import { useQuery } from "@tanstack/react-query";
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

export function toDateKey(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Fetches per-course attendance sequentially (one request at a time, to
 * avoid hammering the server) and aggregates it into a date-keyed map.
 * `staleTime: Infinity` keeps this a one-shot fetch per session, same as
 * the module-level cache it replaces.
 */
export function useCalendarAttendanceQuery(
	token: string | null,
	studentId: number | null,
	attendanceData: StudentDetails | null,
) {
	const courseComponentIds =
		attendanceData?.attendanceCourseComponentInfoList.flatMap((course) =>
			course.attendanceCourseComponentNameInfoList.map(
				(component) => component.courseComponentId,
			),
		);

	return useQuery({
		queryKey: ["calendarAttendance", token, studentId, courseComponentIds],
		queryFn: async (): Promise<DayMap> => {
			if (!attendanceData || !token || !studentId) return {};

			const requests = attendanceData.attendanceCourseComponentInfoList.flatMap(
				(course) =>
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

			for (const req of requests) {
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
				} catch {
					// Skip failed courses — some legitimately have no classes yet.
				}
			}

			return dayMap;
		},
		enabled: !!token && !!studentId && !!attendanceData,
		staleTime: Number.POSITIVE_INFINITY,
	});
}
