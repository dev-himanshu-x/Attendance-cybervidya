import { AlertTriangle, ArrowRight, CheckCircle } from "lucide-react";
import { memo } from "react";
import { useTargetPercentage } from "../../hooks/useTargetPercentage";
import { calculateAttendanceProjection } from "../../lib/attendanceProjection";
import type { CourseAttendanceInfo } from "../../types/response";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import type { SelectedComponentType } from "./Attendance";

interface CourseCardProps {
	onViewDaywiseAttendance: (
		course: SelectedComponentType["course"],
		component: SelectedComponentType["component"],
	) => void;
	course: CourseAttendanceInfo;
}

function CourseCard({ onViewDaywiseAttendance, course }: CourseCardProps) {
	const { targetPercentage } = useTargetPercentage();

	const componentStats = course.attendanceCourseComponentNameInfoList.map(
		(component) => {
			const present =
				component.numberOfPresent + component.numberOfExtraAttendance;
			const total = component.numberOfPeriods;
			const percent = total > 0 ? (present / total) * 100 : 0;
			return { component, present, total, percent };
		},
	);

	const totalPresent = componentStats.reduce((sum, c) => sum + c.present, 0);
	const totalClasses = componentStats.reduce((sum, c) => sum + c.total, 0);
	const totalAbsent = Math.max(0, totalClasses - totalPresent);
	const overallPercent =
		totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;
	const overallProjection = calculateAttendanceProjection(
		totalPresent,
		totalClasses,
		targetPercentage,
	);
	const isOnTarget = overallProjection.status === "safe";
	const hasProjectedComponent = componentStats.some(
		({ component }) => component.isProjected,
	);
	const primaryComponent = componentStats[0]?.component;

	return (
		<Card>
			<div className="flex justify-between items-start gap-2 mb-4">
				<h3 className="text-base font-bold mb-0 text-brutal">
					{course.courseName}
				</h3>
				<Badge size="sm" variant="highlight" className="shrink-0">
					{course.courseCode}
				</Badge>
			</div>

			<div className="flex items-center gap-4 mb-4">
				<div
					className="attendance-meter attendance-meter--sm"
					style={
						{
							"--ring-value": overallPercent,
							"--ring-color": "var(--status-good)",
							"--ring-track-color": "var(--status-critical)",
						} as React.CSSProperties
					}
				>
					<span className="attendance-meter__value">
						{overallPercent.toFixed(0)}%
					</span>
				</div>

				<div className="flex-1 min-w-0 flex flex-col gap-2">
					{componentStats.map(({ component, present, total, percent }) => (
						<div key={component.componentName} className="flex flex-col gap-1">
							<span className="text-xs font-semibold text-brutal truncate">
								{component.componentName}
							</span>
							<div className="flex items-center gap-2">
								<div className="course-card__segmented-bar flex-1">
									<div
										className="course-card__segment--present"
										style={{ flex: `${present} 0 0` }}
									/>
									<div
										className="course-card__segment--absent"
										style={{ flex: `${Math.max(0, total - present)} 0 0` }}
									/>
								</div>
								<span
									className={`text-xs font-bold shrink-0 ${
										percent >= targetPercentage
											? "text-[var(--status-good)]"
											: "text-[var(--status-critical)]"
									}`}
								>
									{present}/{total}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			<div
				className={`flex items-center gap-2 text-sm mb-3 ${
					isOnTarget
						? "text-[var(--status-good)]"
						: "text-[var(--clay-warning)]"
				}`}
			>
				{isOnTarget ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
				{overallProjection.message}
				{hasProjectedComponent && (
					<span className="text-[var(--clay-muted)] font-normal">
						(includes a projected class)
					</span>
				)}
			</div>

			<div className="grid grid-cols-3 gap-2 mb-4">
				<div className="course-stat-tile course-stat-tile--present">
					<span className="course-stat-tile__label">Present</span>
					<span className="course-stat-tile__value">{totalPresent}</span>
				</div>
				<div className="course-stat-tile course-stat-tile--absent">
					<span className="course-stat-tile__label">Absent</span>
					<span className="course-stat-tile__value">{totalAbsent}</span>
				</div>
				<div className="course-stat-tile course-stat-tile--total">
					<span className="course-stat-tile__label">Total</span>
					<span className="course-stat-tile__value">{totalClasses}</span>
				</div>
			</div>

			{primaryComponent && (
				<button
					type="button"
					onClick={() => onViewDaywiseAttendance(course, primaryComponent)}
					className="btn-brutal btn-brutal--accent w-full"
				>
					View Daywise Attendance
					<ArrowRight size={16} />
				</button>
			)}
		</Card>
	);
}

export default memo(CourseCard);
