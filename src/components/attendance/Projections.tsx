import { useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Utensils, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { fetchScheduleClasses } from "../../api/schedule";
import { formatShortTime, toLectureDateString } from "../../lib/schedule";
import { attendanceQueryKey } from "../../queries/useAttendanceQuery";
import type { ScheduleEntry, StudentDetails } from "../../types/response";
import Card from "../ui/Card";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type PlannerMode = "weekly" | "datewise";

function parseInputDateString(value: string): Date {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day);
}

function formatInputDateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatPickerDate(value: string): string {
	if (!value) return "…";
	return parseInputDateString(value).toLocaleDateString("en-US", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// When the ERP has no direct schedule for a date range (e.g. a future
// holiday), project the student's regular weekly timetable onto each date
// in the range instead, so the planner still has something to show.
function projectTemplateOntoRange(
	weeklyTemplate: ScheduleEntry[],
	start: Date,
	end: Date,
): ClassEntry[] {
	const byDayOfWeek = new Map<number, ScheduleEntry[]>();
	for (const entry of weeklyTemplate) {
		if (entry.type !== "CLASS" || !entry.lectureDate) continue;
		const [day, month, year] = entry.lectureDate.split("/").map(Number);
		const dow = new Date(year, month - 1, day).getDay();
		const list = byDayOfWeek.get(dow) ?? [];
		list.push(entry);
		byDayOfWeek.set(dow, list);
	}

	const projected: ClassEntry[] = [];
	const cursor = new Date(start);
	while (cursor <= end) {
		const templateClasses = byDayOfWeek.get(cursor.getDay()) ?? [];
		const lectureDate = toLectureDateString(cursor);

		for (const entry of templateClasses) {
			const startTime = entry.start.split(" ")[1] ?? entry.start;
			const endTime = entry.end.split(" ")[1] ?? entry.end;
			const classStart = `${lectureDate} ${startTime}`;
			const classEnd = `${lectureDate} ${endTime}`;
			projected.push({
				...entry,
				lectureDate,
				start: classStart,
				end: classEnd,
				formattedStart: formatShortTime(classStart),
				formattedEnd: formatShortTime(classEnd),
			});
		}

		cursor.setDate(cursor.getDate() + 1);
	}

	return projected;
}

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
	const [mode, setMode] = useState<PlannerMode>("weekly");
	const [rangeStart, setRangeStart] = useState("");
	const [rangeEnd, setRangeEnd] = useState("");
	const [isFetchingRange, setIsFetchingRange] = useState(false);
	const [rangeError, setRangeError] = useState("");
	const [rangeClasses, setRangeClasses] = useState<ClassEntry[] | null>(null);
	const [rangeFromTemplate, setRangeFromTemplate] = useState(false);

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

	const today = useMemo(() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}, []);

	const groupedSchedule = useMemo(() => {
		const grouped = new Map<string, { date: Date; classes: ClassEntry[] }>();

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
			.filter((c) => c.type === "CLASS" && !!c.lectureDate)
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
					grouped.set(dayKey, { date: classDate, classes: [] });
				}
				grouped.get(dayKey)?.classes.push({
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

	const fetchClassesForRange = useCallback(
		async (start: Date, end: Date) => {
			if (token) {
				try {
					const entries = await fetchScheduleClasses(token, start, end);
					const directClasses = entries.filter((c) => c.type === "CLASS");
					if (directClasses.length > 0) {
						return {
							classes: directClasses.map((c) => ({
								...c,
								formattedStart: formatShortTime(c.start),
								formattedEnd: formatShortTime(c.end),
							})),
							fromTemplate: false,
						};
					}
				} catch {
					// Fall through to the weekly-template projection below.
				}
			}
			return {
				classes: projectTemplateOntoRange(schedule, start, end),
				fromTemplate: true,
			};
		},
		[token, schedule],
	);

	const handleLoadRange = useCallback(async () => {
		if (!rangeStart || !rangeEnd) {
			setRangeError("Please select both start and end dates.");
			return;
		}
		if (rangeStart > rangeEnd) {
			setRangeError("End date cannot be earlier than start date.");
			return;
		}
		setRangeError("");
		setIsFetchingRange(true);
		const { classes, fromTemplate } = await fetchClassesForRange(
			parseInputDateString(rangeStart),
			parseInputDateString(rangeEnd),
		);
		setRangeClasses(classes);
		setRangeFromTemplate(fromTemplate);
		setIsFetchingRange(false);
	}, [rangeStart, rangeEnd, fetchClassesForRange]);

	const handleDiwaliPreset = useCallback(() => {
		const year = new Date().getFullYear();
		setRangeStart(`${year}-11-05`);
		setRangeEnd(`${year}-11-13`);
		setRangeClasses(null);
		setRangeError("");
	}, []);

	const selectedRange = useMemo<DateRange>(
		() => ({
			from: rangeStart ? parseInputDateString(rangeStart) : undefined,
			to: rangeEnd ? parseInputDateString(rangeEnd) : undefined,
		}),
		[rangeStart, rangeEnd],
	);

	const handleRangeSelect = useCallback((range: DateRange | undefined) => {
		setRangeStart(range?.from ? formatInputDateString(range.from) : "");
		setRangeEnd(range?.to ? formatInputDateString(range.to) : "");
		setRangeClasses(null);
		setRangeError("");
	}, []);

	const groupedRangeClasses = useMemo(() => {
		if (!rangeClasses) return [];
		const map = new Map<
			string,
			{ label: string; date: Date; classes: ClassEntry[] }
		>();

		for (const cls of rangeClasses) {
			if (!cls.lectureDate) continue;
			const [day, month, year] = cls.lectureDate.split("/").map(Number);
			const date = new Date(year, month - 1, day);
			if (!map.has(cls.lectureDate)) {
				map.set(cls.lectureDate, {
					label: date.toLocaleDateString("en-US", {
						weekday: "short",
						month: "short",
						day: "numeric",
					}),
					date,
					classes: [],
				});
			}
			map.get(cls.lectureDate)?.classes.push(cls);
		}

		return Array.from(map.values()).sort(
			(a, b) => a.date.getTime() - b.date.getTime(),
		);
	}, [rangeClasses]);

	const renderSlotCells = useCallback(
		(classes: ClassEntry[], slots: typeof morningSlots, isPastDay: boolean) => {
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
							className="projection-table__empty text-center text-sm align-middle"
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
							disabled={isPastDay}
							onClick={() =>
								handleClassToggle(classItem.start, classItem.courseCode)
							}
							className={`class-chip ${isMissed ? "class-chip--missed" : ""} ${
								isPastDay ? "class-chip--disabled" : ""
							}`}
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
		<Card className="mb-6">
			<div className="flex items-center justify-between gap-2 mb-4">
				<div className="toggle-switch">
					<button
						type="button"
						className={`toggle-switch__btn ${
							mode === "weekly" ? "toggle-switch__btn--active" : ""
						}`}
						onClick={() => setMode("weekly")}
					>
						Weekly
					</button>
					<button
						type="button"
						className={`toggle-switch__btn ${
							mode === "datewise" ? "toggle-switch__btn--active" : ""
						}`}
						onClick={() => setMode("datewise")}
					>
						Date wise
					</button>
					<div
						className={`toggle-switch__indicator ${
							mode === "datewise" ? "toggle-switch__indicator--right" : ""
						}`}
					/>
				</div>
				<div className="flex items-center gap-2">
					{mode === "datewise" && (
						<button
							type="button"
							onClick={handleDiwaliPreset}
							className="btn-brutal btn-brutal--tinted"
						>
							Diwali Preset (5–13 Nov)
						</button>
					)}
					<button
						type="button"
						className="btn-brutal btn-brutal--plain"
						onClick={onClose}
						aria-label="Close bunk planner"
					>
						<X size={18} />
					</button>
				</div>
			</div>

			{mode === "weekly" ? (
				dayEntries.length === 0 ? (
					<p className="text-brutal text-[var(--clay-muted)]">
						No classes found for this week.
					</p>
				) : (
					<>
						<div className="flex justify-end mb-2">
							<span className="inline-block md:hidden text-sm text-[var(--clay-muted)] bg-[var(--clay-surface)] px-2 py-1 rounded-full whitespace-nowrap shrink-0">
								Scroll →
							</span>
						</div>
						<div className="projection-table__wrap table-scroll">
							<table
								className="projection-table mb-0 text-sm"
								style={{ minWidth: "960px" }}
							>
								<thead>
									<tr>
										<th className="text-center" style={{ width: "5.5rem" }}>
											Day / Date
										</th>
										{morningSlots.map((slot) => (
											<th key={slot.label} className="text-center font-medium">
												{slot.label}
											</th>
										))}

										{hasLunchBreak && (
											<th className="projection-table__lunch text-center">
												LUNCH
											</th>
										)}

										{afternoonSlots.map((slot) => (
											<th key={slot.label} className="text-center font-medium">
												{slot.label}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{dayEntries.map(([dayKey, { date, classes }]) => {
										const [weekday, ...restDate] = dayKey.split(", ");
										const dateStr = restDate.join(", ");
										const isPastDay = date < today;
										const isToday = date.getTime() === today.getTime();

										return (
											<tr
												key={dayKey}
												className={
													isPastDay
														? "projection-table__row--past"
														: isToday
															? "projection-table__row--today"
															: undefined
												}
											>
												<td className="projection-table__day text-center align-middle">
													<div className="text-sm">{weekday}</div>
													<div className="text-sm font-normal">{dateStr}</div>
												</td>

												{renderSlotCells(classes, morningSlots, isPastDay)}

												{hasLunchBreak && (
													<td className="projection-table__lunch">
														<div className="projection-table__lunch-icon">
															<Utensils size={20} />
														</div>
													</td>
												)}

												{renderSlotCells(classes, afternoonSlots, isPastDay)}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</>
				)
			) : (
				<>
					<div className="flex items-center gap-3 flex-wrap mb-4">
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="form-control-brutal planner-date-field flex items-center gap-2 text-left w-auto"
								>
									<CalendarIcon
										size={16}
										className="text-[var(--clay-muted)] shrink-0"
									/>
									{rangeStart || rangeEnd ? (
										<span>
											{formatPickerDate(rangeStart)} –{" "}
											{formatPickerDate(rangeEnd)}
										</span>
									) : (
										<span className="text-[var(--clay-muted)]">
											Select date range
										</span>
									)}
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="range"
									numberOfMonths={2}
									selected={selectedRange}
									onSelect={handleRangeSelect}
									defaultMonth={selectedRange.from}
								/>
							</PopoverContent>
						</Popover>
						<button
							type="button"
							onClick={handleLoadRange}
							disabled={isFetchingRange || !rangeStart || !rangeEnd}
							className="btn-brutal btn-brutal--accent"
						>
							{isFetchingRange ? "Loading…" : "Show classes"}
						</button>
					</div>

					{rangeError && (
						<p className="text-xs font-semibold text-[var(--clay-danger)] mb-4">
							{rangeError}
						</p>
					)}

					{rangeClasses &&
						(groupedRangeClasses.length === 0 ? (
							<p className="text-brutal text-[var(--clay-muted)]">
								No classes found for this range.
							</p>
						) : (
							<>
								{rangeFromTemplate && (
									<span className="badge-attendance badge-attendance--sm badge-attendance--tinted inline-block mb-3">
										Projected from your regular weekly timetable
									</span>
								)}
								<div className="flex flex-col gap-4">
									{groupedRangeClasses.map((group) => {
										const isPastDay = group.date < today;
										return (
											<div key={group.label + group.date.toISOString()}>
												<p
													className={`text-brutal text-sm font-bold mb-2 ${
														isPastDay ? "opacity-50" : ""
													}`}
												>
													{group.label}
												</p>
												<div className="flex flex-col gap-2">
													{group.classes.map((cls) => {
														const isMissed = missedClasses.has(cls.start);
														return (
															<button
																key={cls.start}
																type="button"
																disabled={isPastDay}
																onClick={() =>
																	handleClassToggle(cls.start, cls.courseCode)
																}
																className={`class-chip class-chip--row w-full ${
																	isMissed ? "class-chip--missed" : ""
																} ${isPastDay ? "class-chip--disabled" : ""}`}
															>
																<span className="class-chip--row__name">
																	{cls.courseName}
																</span>
																<span className="text-xs font-semibold opacity-80 shrink-0">
																	{cls.formattedStart} - {cls.formattedEnd}
																</span>
															</button>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>
							</>
						))}
				</>
			)}
		</Card>
	);
}
