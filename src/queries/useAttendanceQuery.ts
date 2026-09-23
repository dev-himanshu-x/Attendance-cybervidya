import { useQuery } from "@tanstack/react-query";
import { fetchAttendanceData } from "../api/attendance";
import { getApiMode } from "../api/client";
import type { StudentDetails } from "../types/response";

function withoutProjections(data: StudentDetails): StudentDetails {
	return {
		...data,
		attendanceCourseComponentInfoList:
			data.attendanceCourseComponentInfoList.map((course) => ({
				...course,
				attendanceCourseComponentNameInfoList:
					course.attendanceCourseComponentNameInfoList.map((component) => ({
						...component,
						isProjected: false,
					})),
			})),
	};
}

export function attendanceQueryKey(token: string | null) {
	return ["attendance", token, getApiMode()] as const;
}

export function useAttendanceQuery(token: string | null) {
	return useQuery({
		queryKey: attendanceQueryKey(token),
		queryFn: async () =>
			withoutProjections(await fetchAttendanceData(token as string)),
		enabled: !!token,
	});
}
