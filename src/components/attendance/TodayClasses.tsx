import { CalendarClock, Wand2 } from "lucide-react";
import { useMemo } from "react";
import { formatShortTime, toLectureDateString } from "../../lib/schedule";
import {
	type CourseDay,
	toDateKey,
	useCalendarAttendanceQuery,
} from "../../queries/useCalendarAttendanceQuery";
import type { ScheduleEntry, StudentDetails } from "../../types/response";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";

interface TodayClassesProps {
	token: string | null;
	studentId: number | null;
	attendanceData: StudentDetails | null;
	schedule: ScheduleEntry[];
	isLoading: boolean;
	isProjectionVisible: boolean;
	onToggleProjection: () => void;
}

function findAttendanceStatus(
	entries: CourseDay[],
	cls: ScheduleEntry,
): CourseDay["attendance"] | null {
	const exact = entries.find(
		(e) =>
			e.courseCode === cls.courseCode &&
			e.componentName.trim().toUpperCase() ===
				cls.courseCompName.trim().toUpperCase(),
	);
	if (exact) return exact.attendance;
	const byCourse = entries.find((e) => e.courseCode === cls.courseCode);
	return byCourse ? byCourse.attendance : null;
}

function badgeVariant(attendance: CourseDay["attendance"]) {
	if (attendance === "PRESENT") return "present" as const;
	if (attendance === "ADJUSTED") return "adjusted" as const;
	return "absent" as const;
}

export default function TodayClasses({
	token,
	studentId,
	attendanceData,
	schedule,
	isLoading,
	isProjectionVisible,
	onToggleProjection,
}: TodayClassesProps) {
	const calendarQuery = useCalendarAttendanceQuery(
		token,
		studentId,
		attendanceData,
	);
	const todayEntries = calendarQuery.data?.[toDateKey(new Date())] ?? [];

	const todaysClasses = useMemo(() => {
		const todayStr = toLectureDateString(new Date());
		return schedule
			.filter(
				(entry) => entry.type === "CLASS" && entry.lectureDate === todayStr,
			)
			.sort((a, b) => a.start.localeCompare(b.start));
	}, [schedule]);

	return (
		<Card className="h-100 d-flex flex-column">
			<div className="d-flex align-items-center justify-content-between mb-3 gap-2">
				<h3 className="fs-6 fw-bold text-brutal mb-0">Today's Classes</h3>
				<Button
					variant="tinted"
					active={isProjectionVisible}
					icon={<Wand2 size={14} />}
					onClick={onToggleProjection}
				>
					{isProjectionVisible ? "Hide Projection" : "Weekly Projection"}
				</Button>
			</div>

			{isLoading ? (
				<div className="d-flex flex-column gap-2">
					<Skeleton style={{ height: "2.5rem" }} />
					<Skeleton style={{ height: "2.5rem" }} />
				</div>
			) : todaysClasses.length === 0 ? (
				<div className="d-flex flex-column align-items-center text-center text-secondary py-3 flex-grow-1 justify-content-center">
					<CalendarClock size={28} className="mb-2" />
					<p className="small mb-0">No classes scheduled today.</p>
				</div>
			) : (
				<div className="d-flex flex-column gap-2">
					{todaysClasses.map((cls) => {
						const status = findAttendanceStatus(todayEntries, cls);
						return (
							<div
								key={`${cls.courseCode}-${cls.start}`}
								className="today-classes__item"
							>
								<div className="text-truncate">
									<div className="small fw-semibold text-brutal text-truncate">
										{cls.courseName}
									</div>
									<div
										className="text-secondary text-truncate"
										style={{ fontSize: "0.75rem" }}
									>
										{cls.courseCompName}
										{cls.classRoom ? ` • ${cls.classRoom}` : ""}
									</div>
								</div>
								<div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
									<span
										className="text-secondary fw-semibold"
										style={{ fontSize: "0.75rem" }}
									>
										{formatShortTime(cls.start)} - {formatShortTime(cls.end)}
									</span>
									{calendarQuery.isLoading ? (
										<Skeleton style={{ width: "3.5rem", height: "1rem" }} />
									) : status ? (
										<Badge size="sm" variant={badgeVariant(status)}>
											{status}
										</Badge>
									) : (
										<Badge size="sm" variant="adjusted">
											Not marked
										</Badge>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</Card>
	);
}
