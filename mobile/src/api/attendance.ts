import type {
	AttendanceApiResponse,
	ScheduleEntry,
	ScheduleResponse,
	StudentAttendanceApiResponse,
	StudentDetails,
} from "@/types/response";
import { request } from "./http";

export async function fetchAttendanceData(
	token: string,
): Promise<StudentDetails> {
	const response = await request<StudentAttendanceApiResponse>(
		"/api/attendance/course/component/student",
		{ token },
	);
	return response.data;
}

export async function fetchStudentId(token: string): Promise<number | null> {
	const response = await request<{ data: { studentId: number }[] }>(
		"/api/student/dashboard/registered-courses",
		{ token },
	);
	return response.data[0]?.studentId ?? null;
}

export interface CourseAttendancePayload {
	courseCompId: number;
	courseId: number;
	sessionId: number | null;
	studentId: number | string;
}

export async function fetchCourseAttendance(
	token: string,
	payload: CourseAttendancePayload,
) {
	const response = await request<AttendanceApiResponse>(
		"/api/attendance/schedule/student/course/attendance/percentage",
		{ method: "POST", token, body: payload },
	);
	return response.data;
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

export async function fetchSchedule(
	token: string,
	startDate: string,
	endDate: string,
): Promise<ScheduleEntry[]> {
	const response = await request<ScheduleResponse>(
		"/api/student/schedule/class",
		{
			token,
			params: { weekStartDate: startDate, weekEndDate: endDate },
		},
	);
	return removeDuplicateEntries(response.data ?? []);
}
