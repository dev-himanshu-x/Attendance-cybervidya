import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { getWeekRange } from "../../api/schedule";
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

function toDateOnly(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDayLabel(date: Date): string {
	return date.toLocaleDateString("en-US", {
		weekday: "short",
		day: "numeric",
		month: "short",
	});
}

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
	const today = useMemo(() => toDateOnly(new Date()), []);
	const weekBounds = useMemo(() => getWeekRange(), []);
	const [selectedDate, setSelectedDate] = useState(today);

	const isToday = selectedDate.getTime() === today.getTime();
	const canGoPrev = selectedDate.getTime() > weekBounds.startDate.getTime();
	const canGoNext = selectedDate.getTime() < weekBounds.endDate.getTime();

	const shiftSelectedDate = (days: number) => {
		setSelectedDate((prev) => {
			const next = new Date(prev);
			next.setDate(prev.getDate() + days);
			return next;
		});
	};
	const goPrevDay = () => canGoPrev && shiftSelectedDate(-1);
	const goNextDay = () => canGoNext && shiftSelectedDate(1);
	const goToToday = () => setSelectedDate(today);

	const classesForSelectedDate = useMemo(() => {
		const dateStr = toLectureDateString(selectedDate);
		return schedule
			.filter(
				(entry) => entry.type === "CLASS" && entry.lectureDate === dateStr,
			)
			.sort((a, b) => a.start.localeCompare(b.start));
	}, [schedule, selectedDate]);

	// Only fetch attendance history for the courses meeting this week, not
	// the student's whole course list — these badges only need these rows.
	const weekCourseCodes = useMemo(
		() =>
			new Set(
				schedule
					.filter((entry) => entry.type === "CLASS")
					.map((entry) => entry.courseCode),
			),
		[schedule],
	);

	const calendarQuery = useCalendarAttendanceQuery(
		token,
		studentId,
		attendanceData,
		weekCourseCodes,
	);
	const selectedDateEntries =
		calendarQuery.data?.[toDateKey(selectedDate)] ?? [];

	return (
		<Card className="h-full flex flex-col">
			<div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
				<div className="flex items-center gap-3 min-w-0">
					<button
						type="button"
						onClick={goPrevDay}
						disabled={!canGoPrev}
						className="btn-brutal btn-brutal--outline calendar-view__nav-btn today-classes__nav-btn"
						aria-label="Previous day"
					>
						<ChevronLeft size={16} />
					</button>
					<div className="flex flex-col items-center min-w-[8rem]">
						<h3 className="text-base font-bold text-brutal mb-0 whitespace-nowrap">
							{isToday ? "Today's Classes" : formatDayLabel(selectedDate)}
						</h3>
						{!isToday && (
							<button
								type="button"
								onClick={goToToday}
								className="calendar-view__today-link"
							>
								Jump to today
							</button>
						)}
					</div>
					<button
						type="button"
						onClick={goNextDay}
						disabled={!canGoNext}
						className="btn-brutal btn-brutal--outline calendar-view__nav-btn today-classes__nav-btn"
						aria-label="Next day"
					>
						<ChevronRight size={16} />
					</button>
				</div>
				<Button
					variant="tinted"
					active={isProjectionVisible}
					onClick={onToggleProjection}
				>
					{isProjectionVisible ? "Hide Bunk Planner" : "Bunk Planner"}
				</Button>
			</div>

			{isLoading ? (
				<div className="flex flex-col gap-2">
					<Skeleton style={{ height: "2.5rem" }} />
					<Skeleton style={{ height: "2.5rem" }} />
				</div>
			) : classesForSelectedDate.length === 0 ? (
				<div className="flex flex-col items-center text-center text-[var(--clay-muted)] py-4 grow justify-center">
					<CalendarClock size={28} className="mb-2" />
					<p className="text-sm mb-0">
						{isToday
							? "No classes scheduled today."
							: "No classes scheduled on this day."}
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{classesForSelectedDate.map((cls) => {
						const status = findAttendanceStatus(selectedDateEntries, cls);
						return (
							<div
								key={`${cls.courseCode}-${cls.start}`}
								className="today-classes__item"
							>
								<div className="truncate min-w-0 flex-1">
									<div className="text-sm font-semibold text-brutal truncate">
										{cls.courseName}
									</div>
									<div
										className="text-[var(--clay-muted)] truncate"
										style={{ fontSize: "0.75rem" }}
									>
										{cls.courseCompName}
										{cls.classRoom ? ` • ${cls.classRoom}` : ""}
									</div>
								</div>
								<div className="flex flex-col items-end gap-1 shrink-0">
									<span
										className="text-[var(--clay-muted)] font-semibold"
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
