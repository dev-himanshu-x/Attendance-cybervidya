import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { formatShortTime } from "../../lib/schedule";
import { attendanceQueryKey } from "../../queries/useAttendanceQuery";
import type { ScheduleEntry, StudentDetails } from "../../types/response";
import Card from "../ui/Card";

type ClassEntry = ScheduleEntry & {
	formattedStart: string;
	formattedEnd: string;
};

interface ProjectionsProps {
	token: string | null;
	schedule: ScheduleEntry[];
	onClose: () => void;
}

export default function Projections({
	token,
	schedule,
	onClose,
}: ProjectionsProps) {
	const queryClient = useQueryClient();
	const [missedClasses, setMissedClasses] = useState<Set<string>>(new Set());

	const updateProjectedAttendance = useCallback(
		(courseCode: string, action: "add" | "subtract") => {
			const adjustment = action === "add" ? 1 : -1;

			queryClient.setQueryData<StudentDetails>(
				attendanceQueryKey(token),
				(prevData) => {
					if (!prevData) return prevData;

					const courseList = prevData.attendanceCourseComponentInfoList;
					if (!courseList) return prevData;

					const newCourseList = courseList.map((course) => {
						if (course.courseCode === courseCode) {
							const updatedNameInfoList = [
								...course.attendanceCourseComponentNameInfoList,
							];

							updatedNameInfoList[0] = {
								...updatedNameInfoList[0],
								numberOfPeriods:
									updatedNameInfoList[0].numberOfPeriods + adjustment,
								isProjected: action === "add",
							};

							return {
								...course,
								attendanceCourseComponentNameInfoList: updatedNameInfoList,
							};
						}
						return course;
					});

					return {
						...prevData,
						attendanceCourseComponentInfoList: newCourseList,
					};
				},
			);
		},
		[queryClient, token],
	);

	const timeSlots = useMemo(() => {
		const slotsMap = new Map<
			string,
			{
				label: string;
				formattedStart: string;
				formattedEnd: string;
				timeVal: number;
			}
		>();

		schedule.forEach((item) => {
			if (item.type !== "CLASS") return;
			const startTimeStr = item.start.split(" ")[1] || "";
			const key = `${startTimeStr}-${item.end.split(" ")[1] || ""}`;

			if (!slotsMap.has(key)) {
				const [h, m] = startTimeStr.split(":").map(Number);
				const formattedStart = formatShortTime(item.start);
				const formattedEnd = formatShortTime(item.end);
				slotsMap.set(key, {
					label: `${formattedStart} - ${formattedEnd}`,
					formattedStart,
					formattedEnd,
					timeVal: (h || 0) * 60 + (m || 0),
				});
			}
		});

		const sorted = Array.from(slotsMap.values()).sort(
			(a, b) => a.timeVal - b.timeVal,
		);
		return {
			morning: sorted.filter((s) => s.timeVal < 13 * 60),
			afternoon: sorted.filter((s) => s.timeVal >= 13 * 60),
		};
	}, [schedule]);

	const { morning: morningSlots, afternoon: afternoonSlots } = timeSlots;
	const hasLunchBreak = morningSlots.length > 0 && afternoonSlots.length > 0;

	const groupedSchedule = useMemo(() => {
		const grouped = new Map<string, ClassEntry[]>();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const parseDate = (lectureDate: string, startTime: string): Date => {
			const [day, month, year] = lectureDate.split("/").map(Number);
			const [hours, minutes, seconds] = startTime.split(":");
			return new Date(
				year,
				month - 1,
				day,
				Number(hours),
				Number(minutes),
				Number(seconds),
			);
		};

		schedule
			.filter((c) => {
				if (c.type !== "CLASS" || !c.lectureDate) return false;
				const [day, month, year] = c.lectureDate.split("/").map(Number);
				const classDate = new Date(year, month - 1, day);
				return classDate >= today;
			})
			.map((c) => ({
				...c,
				timestamp: parseDate(
					c.lectureDate as string,
					c.start.split(" ")[1],
				).getTime(),
			}))
			.sort((a, b) => a.timestamp - b.timestamp)
			.forEach((c) => {
				const [day, month, year] = (c.lectureDate as string)
					.split("/")
					.map(Number);
				const classDate = new Date(year, month - 1, day);

				const dayKey = classDate.toLocaleDateString("en-US", {
					weekday: "short",
					month: "short",
					day: "numeric",
				});

				if (!grouped.has(dayKey)) {
					grouped.set(dayKey, []);
				}
				grouped.get(dayKey)?.push({
					...c,
					formattedStart: formatShortTime(c.start),
					formattedEnd: formatShortTime(c.end),
				});
			});

		return grouped;
	}, [schedule]);

	const handleClassToggle = useCallback(
		(classStart: string, courseCode: string) => {
			const nextSet = new Set(missedClasses);
			if (nextSet.has(classStart)) {
				nextSet.delete(classStart);
				updateProjectedAttendance(courseCode, "subtract");
			} else {
				nextSet.add(classStart);
				updateProjectedAttendance(courseCode, "add");
			}
			setMissedClasses(nextSet);
		},
		[missedClasses, updateProjectedAttendance],
	);

	const renderSlotCells = useCallback(
		(classes: ClassEntry[], slots: typeof morningSlots) => {
			return slots.map((slot) => {
				const classItem = classes.find(
					(c) =>
						c.formattedStart === slot.formattedStart &&
						c.formattedEnd === slot.formattedEnd,
				);

				if (!classItem) {
					return (
						<td
							key={slot.label}
							className="projection-table__empty text-center small align-middle"
						>
							-
						</td>
					);
				}

				const isMissed = missedClasses.has(classItem.start);

				return (
					<td key={classItem.start} className="p-0 align-middle">
						<button
							type="button"
							onClick={() =>
								handleClassToggle(classItem.start, classItem.courseCode)
							}
							className={`class-chip ${isMissed ? "class-chip--missed" : ""}`}
						>
							{classItem.courseName}
						</button>
					</td>
				);
			});
		},
		[handleClassToggle, missedClasses],
	);

	const dayEntries = Array.from(groupedSchedule.entries());

	return (
		<Card className="mb-4">
			<div className="d-flex align-items-center justify-content-between gap-2 mb-1">
				<div className="d-flex align-items-center gap-2">
					<CalendarDays size={24} className="text-primary" />
					<h3 className="text-brutal fs-6 fw-semibold mb-0">
						Weekly Projection
						<br />
						(Today Onwards)
					</h3>
				</div>
				<button
					type="button"
					className="btn-brutal btn-brutal--plain"
					onClick={onClose}
					aria-label="Close weekly projection"
				>
					<X size={18} />
				</button>
			</div>
			<div className="d-flex align-items-center justify-content-between gap-2 mb-3">
				<p className="text-brutal small text-secondary mb-0">
					Click on any class block to mark it as planned to miss:
				</p>
				<span className="d-md-none small text-secondary bg-light px-2 py-1 rounded-pill text-nowrap flex-shrink-0">
					Scroll →
				</span>
			</div>

			{dayEntries.length === 0 ? (
				<p className="text-brutal text-secondary">
					No upcoming classes found for the rest of the week.
				</p>
			) : (
				<div className="projection-table__wrap table-scroll">
					<table
						className="projection-table mb-0 small"
						style={{ minWidth: "960px" }}
					>
						<thead>
							<tr>
								<th className="text-center" style={{ width: "5.5rem" }}>
									Day / Date
								</th>
								{morningSlots.map((slot) => (
									<th key={slot.label} className="text-center fw-medium">
										{slot.label}
									</th>
								))}

								{hasLunchBreak && (
									<th className="projection-table__lunch text-center">LUNCH</th>
								)}

								{afternoonSlots.map((slot) => (
									<th key={slot.label} className="text-center fw-medium">
										{slot.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{dayEntries.map(([dayKey, classes]) => {
								const [weekday, ...restDate] = dayKey.split(", ");
								const dateStr = restDate.join(", ");

								return (
									<tr key={dayKey}>
										<td className="projection-table__day text-center align-middle">
											<div className="small">{weekday}</div>
											<div className="small fw-normal">{dateStr}</div>
										</td>

										{renderSlotCells(classes, morningSlots)}

										{hasLunchBreak && (
											<td className="projection-table__lunch text-center align-middle">
												LUNCH
											</td>
										)}

										{renderSlotCells(classes, afternoonSlots)}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</Card>
	);
}
