import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useTargetPercentage } from "../../hooks/useTargetPercentage";
import { useToast } from "../../hooks/useToast";
import type {
	CourseDay,
	DayMap,
} from "../../queries/useCalendarAttendanceQuery";
import { useCalendarAttendanceQuery } from "../../queries/useCalendarAttendanceQuery";
import type { StudentDetails } from "../../types/response";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import Skeleton from "../ui/Skeleton";

interface CalendarViewProps {
	token: string;
	studentId: number;
	attendanceData: StudentDetails | null;
}

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Matches the "at risk" threshold used elsewhere (OverallAtt) so the same
// percentage reads as the same color everywhere in the app.
const STATUS_STEPS_BELOW_TARGET = 10;

function formatDateLabel(dateKey: string): string {
	const [y, m, d] = dateKey.split("-");
	const dayName = new Date(`${y}-${m}-${d}`).toLocaleDateString("en-US", {
		weekday: "long",
	});
	return `${dayName}, ${d} ${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

// Extracts the start time of a slot like "09:00 AM - 10:00 AM" into minutes-since-midnight
function timeSlotStartMinutes(timeSlot: string): number {
	const match = timeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
	if (!match) return 0;
	let hours = Number(match[1]);
	const minutes = Number(match[2]);
	const period = match[3]?.toUpperCase();
	if (period === "PM" && hours !== 12) hours += 12;
	if (period === "AM" && hours === 12) hours = 0;
	return hours * 60 + minutes;
}

// ── Attendance Ring ──────────────────────────────────────────────────────────
interface AttendanceRingProps {
	percent: number;
	color: string;
	gradientFrom: string;
	gradientTo: string;
}

function AttendanceRing({
	percent,
	color,
	gradientFrom,
	gradientTo,
}: AttendanceRingProps) {
	const size = 60;
	const stroke = 6;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const clamped = Math.min(100, Math.max(0, percent));
	const offset = circumference * (1 - clamped / 100);
	const gradientId = `calendar-ring-gradient-${useId()}`;

	return (
		<div className="calendar-view__ring" style={{ color }}>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				role="img"
				aria-label={`${Math.round(percent)}% attendance this month`}
			>
				<defs>
					<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor={gradientFrom} />
						<stop offset="100%" stopColor={gradientTo} />
					</linearGradient>
				</defs>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="rgba(163, 177, 198, 0.22)"
					strokeWidth={stroke}
				/>
				<circle
					className="calendar-view__ring-progress"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={`url(#${gradientId})`}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
				/>
			</svg>
			<span className="calendar-view__ring-label">{Math.round(percent)}%</span>
		</div>
	);
}

// ── Day Detail Modal ────────────────────────────────────────────────────────
interface DayModalProps {
	dateKey: string;
	entries: CourseDay[];
	onClose: () => void;
}

function DayModal({ dateKey, entries, onClose }: DayModalProps) {
	const sorted = useMemo(
		() =>
			[...entries].sort(
				(a, b) =>
					timeSlotStartMinutes(a.timeSlot) - timeSlotStartMinutes(b.timeSlot),
			),
		[entries],
	);

	const presentCount = sorted.filter(
		(e) => e.attendance === "PRESENT" || e.attendance === "ADJUSTED",
	).length;
	const absentCount = sorted.filter((e) => e.attendance === "ABSENT").length;

	return (
		<Modal onClose={onClose}>
			<div className="d-flex justify-content-between align-items-start gap-2 mb-4 pb-3 calendar-view__divider-bottom">
				<div className="text-truncate">
					<h2 className="fs-5 fw-bold text-brutal mb-0">
						{formatDateLabel(dateKey)}
					</h2>
					<div className="d-flex flex-wrap gap-2 mt-2">
						<Badge variant="present">{presentCount} Present</Badge>
						<Badge variant="absent">{absentCount} Absent</Badge>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="btn-brutal btn-brutal--plain flex-shrink-0"
					aria-label="Close"
				>
					<X size={24} />
				</button>
			</div>

			<div className="modal-panel__body d-flex flex-column gap-3">
				{sorted.map((entry, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: list by position
						key={i}
						className="card-panel card-panel--tight"
					>
						<div className="d-flex align-items-start justify-content-between gap-2">
							<div className="text-truncate">
								<p className="fw-bold text-brutal mb-1">{entry.courseName}</p>
								<p className="small fw-semibold text-secondary mb-0">
									{entry.componentName} • {entry.courseCode}
								</p>
							</div>
							<Badge
								size="sm"
								variant={
									entry.attendance === "PRESENT"
										? "present"
										: entry.attendance === "ADJUSTED"
											? "adjusted"
											: "absent"
								}
							>
								{entry.attendance}
							</Badge>
						</div>
						<div className="d-flex align-items-center gap-1 mt-2 fw-semibold text-secondary pt-2 calendar-view__divider-top">
							<Clock size={16} />
							<span className="small">{entry.timeSlot}</span>
						</div>
					</div>
				))}
			</div>
		</Modal>
	);
}

// ── Loading Skeleton ────────────────────────────────────────────────────────
function SkeletonCalendar() {
	return (
		<div className="calendar-view__body px-2 px-sm-3 pb-2 pb-sm-3">
			<div
				className="d-grid mb-1 mb-sm-2"
				style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
			>
				{DAY_NAMES.map((d) => (
					<Skeleton
						key={d}
						className="skeleton--light mx-auto"
						style={{ height: "0.9rem", width: "1.75rem" }}
					/>
				))}
			</div>
			<div
				className="calendar-view__grid"
				style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
			>
				{Array.from({ length: 35 }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
						key={i}
						className="calendar-view__cell"
					/>
				))}
			</div>
		</div>
	);
}

// ── Main CalendarView ───────────────────────────────────────────────────────
export default function CalendarView({
	token,
	studentId,
	attendanceData,
}: CalendarViewProps) {
	const toast = useToast();
	const calendarQuery = useCalendarAttendanceQuery(
		token,
		studentId,
		attendanceData,
	);
	const dayMap: DayMap = calendarQuery.data ?? {};

	const today = new Date();
	const [viewYear, setViewYear] = useState(today.getFullYear());
	const [viewMonth, setViewMonth] = useState(today.getMonth());
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [direction, setDirection] = useState<"prev" | "next">("next");
	const { targetPercentage } = useTargetPercentage();

	useEffect(() => {
		if (calendarQuery.isError) {
			toast.error("Some courses' attendance could not be loaded.");
		}
	}, [calendarQuery.isError, toast]);

	const { cells } = useMemo(() => {
		const firstDay = new Date(viewYear, viewMonth, 1).getDay();
		const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
		const arr: (number | null)[] = [];
		for (let i = 0; i < firstDay; i++) arr.push(null);
		for (let d = 1; d <= dim; d++) arr.push(d);
		while (arr.length % 7 !== 0) arr.push(null);
		return { cells: arr };
	}, [viewYear, viewMonth]);

	const monthStats = useMemo(() => {
		let present = 0;
		let absent = 0;
		let adjusted = 0;
		for (const [key, entries] of Object.entries(dayMap)) {
			const [y, m] = key.split("-");
			if (Number(y) === viewYear && Number(m) - 1 === viewMonth) {
				for (const e of entries) {
					if (e.attendance === "PRESENT") present++;
					else if (e.attendance === "ABSENT") absent++;
					else adjusted++;
				}
			}
		}
		return { present, absent, adjusted, total: present + absent + adjusted };
	}, [dayMap, viewYear, viewMonth]);

	const prevMonth = () => {
		setDirection("prev");
		if (viewMonth === 0) {
			setViewMonth(11);
			setViewYear((y) => y - 1);
		} else setViewMonth((m) => m - 1);
	};
	const nextMonth = () => {
		setDirection("next");
		if (viewMonth === 11) {
			setViewMonth(0);
			setViewYear((y) => y + 1);
		} else setViewMonth((m) => m + 1);
	};

	const loading = calendarQuery.isLoading;
	const isCurrentMonth =
		viewYear === today.getFullYear() && viewMonth === today.getMonth();
	const goToToday = () => {
		const todayIndex = today.getFullYear() * 12 + today.getMonth();
		const viewIndex = viewYear * 12 + viewMonth;
		setDirection(todayIndex < viewIndex ? "prev" : "next");
		setViewYear(today.getFullYear());
		setViewMonth(today.getMonth());
	};

	const attendancePercent =
		monthStats.total > 0
			? ((monthStats.present + monthStats.adjusted) / monthStats.total) * 100
			: 0;
	const attendanceStatus =
		attendancePercent >= targetPercentage
			? "good"
			: attendancePercent >= targetPercentage - STATUS_STEPS_BELOW_TARGET
				? "warning"
				: "critical";
	const attendanceColor = `var(--status-${attendanceStatus})`;
	const attendanceGradient = {
		good: { from: "#4ade80", to: "#0ca30c" },
		warning: { from: "#fbbf24", to: "#fab219" },
		critical: { from: "#f87171", to: "#d03b3b" },
	}[attendanceStatus];

	return (
		<>
			<div className="card-panel calendar-view__card fade-in mb-4 p-0 overflow-hidden">
				<div className="calendar-view__glow" aria-hidden="true" />
				<div className="d-flex align-items-center justify-content-between px-3 py-3 calendar-view__divider-bottom position-relative">
					<button
						type="button"
						onClick={prevMonth}
						className="btn-brutal btn-brutal--outline calendar-view__nav-btn"
						aria-label="Previous month"
					>
						<ChevronLeft size={20} />
					</button>

					<div className="d-flex flex-column align-items-center">
						<h2 className="fs-4 fw-bold mb-0 text-center calendar-view__title">
							{MONTH_NAMES[viewMonth]} {viewYear}
						</h2>
						{!isCurrentMonth && (
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
						onClick={nextMonth}
						className="btn-brutal btn-brutal--outline calendar-view__nav-btn"
						aria-label="Next month"
					>
						<ChevronRight size={20} />
					</button>
				</div>

				{!loading && monthStats.total > 0 && (
					<div className="d-flex flex-wrap gap-3 px-3 py-3 calendar-view__divider-bottom align-items-center justify-content-between calendar-view__summary">
						<div className="d-flex gap-2">
							<Badge variant="present">
								{monthStats.present + monthStats.adjusted} Present
							</Badge>
							<Badge variant="absent">{monthStats.absent} Absent</Badge>
						</div>
						<div className="calendar-view__attendance-summary">
							<span className="calendar-view__attendance-caption text-secondary">
								This month
							</span>
							<AttendanceRing
								percent={attendancePercent}
								color={attendanceColor}
								gradientFrom={attendanceGradient.from}
								gradientTo={attendanceGradient.to}
							/>
						</div>
					</div>
				)}

				<div>
					{loading && <SkeletonCalendar />}

					{!loading && (
						<div className="calendar-view__body px-2 px-sm-3 pb-2 pb-sm-3">
							<div
								className="d-grid mb-1 mb-sm-2"
								style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
							>
								{DAY_NAMES.map((d) => (
									<div
										key={d}
										className="text-center small fw-semibold text-secondary py-1 text-uppercase"
									>
										{d}
									</div>
								))}
							</div>

							<div
								key={`${viewYear}-${viewMonth}`}
								className={`calendar-view__grid calendar-view__grid--${direction}`}
								style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
							>
								{cells.map((day, idx) => {
									const dateKey =
										day !== null
											? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
											: "";
									const entries = dateKey ? (dayMap[dateKey] ?? []) : [];
									const isToday =
										day !== null &&
										today.getFullYear() === viewYear &&
										today.getMonth() === viewMonth &&
										today.getDate() === day;
									const hasClasses = entries.length > 0;
									const presentCount = entries.filter(
										(e) =>
											e.attendance === "PRESENT" || e.attendance === "ADJUSTED",
									).length;
									const absentCount = entries.filter(
										(e) => e.attendance === "ABSENT",
									).length;

									return (
										// biome-ignore lint/a11y/noStaticElementInteractions: interactivity is conditional on hasClasses
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: calendar grid by index
											key={idx}
											role={hasClasses ? "button" : undefined}
											tabIndex={hasClasses ? 0 : undefined}
											className={`calendar-view__cell position-relative p-1 p-sm-2 ${day === null ? "calendar-view__cell--empty" : ""} ${hasClasses ? "cursor-pointer" : ""} ${isToday ? "calendar-view__cell--today" : ""}`}
											onClick={() =>
												hasClasses && day !== null && setSelectedDate(dateKey)
											}
											onKeyDown={(e) =>
												e.key === "Enter" &&
												hasClasses &&
												day !== null &&
												setSelectedDate(dateKey)
											}
										>
											{day !== null && (
												<div className="h-100 d-flex flex-column align-items-start">
													<span
														className={`calendar-view__day-num fw-bold ${
															isToday ? "calendar-view__today" : "text-brutal"
														}`}
													>
														{day}
													</span>

													{hasClasses && (
														<div className="mt-auto pt-2 d-flex flex-wrap gap-1">
															{presentCount > 0 && (
																<span className="calendar-view__chip calendar-view__chip--present">
																	<span className="calendar-view__chip-dot" />
																	{presentCount}
																</span>
															)}
															{absentCount > 0 && (
																<span className="calendar-view__chip calendar-view__chip--absent">
																	<span className="calendar-view__chip-dot" />
																	{absentCount}
																</span>
															)}
														</div>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>

			{selectedDate && (
				<DayModal
					dateKey={selectedDate}
					entries={dayMap[selectedDate] ?? []}
					onClose={() => setSelectedDate(null)}
				/>
			)}
		</>
	);
}
