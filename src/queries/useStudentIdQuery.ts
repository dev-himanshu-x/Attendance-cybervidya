import { useQuery } from "@tanstack/react-query";
import { fetchStudentId } from "../api/attendance";

export function useStudentIdQuery(token: string | null, enabled: boolean) {
	return useQuery({
		queryKey: ["studentId", token],
		queryFn: () => fetchStudentId(token as string),
		enabled: !!token && enabled,
	});
}
