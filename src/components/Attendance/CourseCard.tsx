import { AlertTriangle, CheckCircle } from "lucide-react";
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
	const subjectMissed = 0;

	return (
		<Card>
			<div className="d-flex justify-content-between align-items-start gap-2 mb-3">
				<h3 className="fs-6 fw-bold text-secondary-emphasis mb-0 text-brutal">
					{course.courseName}
				</h3>
				<Badge size="sm" variant="highlight" className="flex-shrink-0">
					{course.courseCode}
				</Badge>
			</div>
			<div className="d-flex flex-column gap-3">
				{course.attendanceCourseComponentNameInfoList.map((component) => {
					const projectedPresent =
						component.numberOfPresent + component.numberOfExtraAttendance;
					const projectedTotal = component.numberOfPeriods + subjectMissed;
					const projectedSubjectPercent =
						projectedTotal > 0 ? (projectedPresent / projectedTotal) * 100 : 0;

					const currentSubjectProjection = calculateAttendanceProjection(
						projectedPresent,
						projectedTotal,
						targetPercentage,
					);

					const isOnTarget = currentSubjectProjection.status === "safe";

					return (
						<div
							key={component.componentName}
							className="pt-3 course-card__divider"
						>
							<div className="d-flex justify-content-between align-items-center mb-2">
								<Badge size="sm" variant="neutral">
									{component.componentName}
								</Badge>
								<span
									className={`small fw-semibold ${
										isOnTarget ? "text-success" : "text-danger"
									}`}
								>
									{`${projectedSubjectPercent.toFixed(1)}% ${component.isProjected ? "(Projected)" : ""}`}
								</span>
							</div>
							<div className="course-card__bar mb-2">
								<div
									className="course-card__bar-fill"
									style={{
										width: `${Math.min(100, projectedSubjectPercent)}%`,
										backgroundColor: isOnTarget
											? "var(--status-good)"
											: "var(--status-critical)",
									}}
								/>
							</div>
							<div className="small text-secondary text-end mb-2">
								Present: {projectedPresent}/{projectedTotal}
							</div>
							<div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
								<div
									className={`d-flex align-items-center gap-2 small ${
										isOnTarget ? "text-success" : "text-warning"
									}`}
								>
									{isOnTarget ? (
										<CheckCircle size={16} />
									) : (
										<AlertTriangle size={16} />
									)}
									{currentSubjectProjection.message}
								</div>
								<button
									type="button"
									onClick={() => onViewDaywiseAttendance(course, component)}
									className="btn-brutal btn-brutal--tinted flex-shrink-0"
								>
									See Daywise Attendance
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}

export default memo(CourseCard);
