import { useQuery } from "@tanstack/react-query";
import { fetchCourseAttendance } from "../api/attendance";

export interface CourseAttendancePayload {
	courseCompId: number;
	courseId: number;
	sessionId: number | null;
	studentId: number | string;
}

export function useCourseAttendanceQuery(
	token: string | null,
	payload: CourseAttendancePayload | null,
) {
	return useQuery({
		queryKey: ["courseAttendance", token, payload],
		// biome-ignore lint/style/noNonNullAssertion: guarded by `enabled`
		queryFn: () => fetchCourseAttendance(token as string, payload!),
		enabled: !!token && !!payload,
	});
}
