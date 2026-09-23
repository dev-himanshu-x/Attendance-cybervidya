import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { memo } from "react";
import { useTargetPercentage } from "../../hooks/useTargetPercentage";
import { calculateAttendanceProjection } from "../../lib/attendanceProjection";
import {
	MAX_TARGET_PERCENTAGE,
	MIN_TARGET_PERCENTAGE,
} from "../../types/constants";
import type { StudentDetails } from "../../types/response";
import Card from "../ui/Card";

interface OverallAttProps {
	attendanceData: StudentDetails | null;
}

const STATUS_STEPS_BELOW_TARGET = 10;

const OverallAtt = memo(function OverallAtt({
	attendanceData,
}: OverallAttProps) {
	const { targetPercentage, setTargetPercentage } = useTargetPercentage();

	if (!attendanceData) return null;

	let totalClasses = 0;
	let presentClasses = 0;

	attendanceData.attendanceCourseComponentInfoList.forEach((course) => {
		const courseData = course.attendanceCourseComponentNameInfoList[0];
		totalClasses += courseData.numberOfPeriods;
		presentClasses +=
			courseData.numberOfExtraAttendance + courseData.numberOfPresent;
	});

	const percentage =
		totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

	const status =
		percentage >= targetPercentage
			? "good"
			: percentage >= targetPercentage - STATUS_STEPS_BELOW_TARGET
				? "warning"
				: "critical";

	const statusMeta = {
		good: {
			color: "var(--status-good)",
			label: "On track",
			Icon: CheckCircle,
		},
		warning: {
			color: "var(--status-warning)",
			label: "At risk",
			Icon: AlertTriangle,
		},
		critical: {
			color: "var(--status-critical)",
			label: "Below target",
			Icon: XCircle,
		},
	}[status];

	const projection = calculateAttendanceProjection(
		presentClasses,
		totalClasses,
		targetPercentage,
	);

	return (
		<Card className="mx-auto mb-4">
			<div className="d-flex flex-column flex-md-row align-items-center gap-4">
				<div
					className="attendance-meter"
					style={
						{
							"--ring-value": percentage,
							"--ring-color": statusMeta.color,
						} as React.CSSProperties
					}
				>
					<div className="d-flex flex-column align-items-center">
						<span className="attendance-meter__value">
							{percentage.toFixed(1)}%
						</span>
						<span className="attendance-meter__label">Overall</span>
					</div>
				</div>

				<div className="flex-grow-1 w-100">
					<h1 className="fs-4 mb-1 fw-bold text-brutal">Overall Attendance</h1>
					<div className="d-flex align-items-center gap-2 small fw-semibold mb-3 text-secondary">
						<statusMeta.Icon size={16} color={statusMeta.color} />
						{statusMeta.label} — {projection.message}
					</div>

					<div className="target-slider">
						<div className="d-flex justify-content-between align-items-center mb-2">
							<label
								htmlFor="target-percentage"
								className="small fw-semibold text-secondary text-brutal mb-0"
							>
								Target attendance
							</label>
							<span className="small fw-bold text-brutal">
								{targetPercentage}%
							</span>
						</div>
						<input
							id="target-percentage"
							type="range"
							min={MIN_TARGET_PERCENTAGE}
							max={MAX_TARGET_PERCENTAGE}
							step={1}
							value={targetPercentage}
							onChange={(e) => setTargetPercentage(Number(e.target.value))}
						/>
					</div>
				</div>
			</div>
		</Card>
	);
});

export default OverallAtt;
