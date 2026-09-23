import { useQuery } from "@tanstack/react-query";
import { fetchScheduleClasses, getWeekRange } from "../api/schedule";

export function useScheduleQuery(token: string | null) {
	return useQuery({
		queryKey: ["schedule", "week", token],
		queryFn: () => {
			const { startDate, endDate } = getWeekRange();
			return fetchScheduleClasses(token as string, startDate, endDate);
		},
		enabled: !!token,
	});
}
