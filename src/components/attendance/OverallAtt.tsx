import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { memo } from "react";
import { useTargetPercentage } from "../../hooks/useTargetPercentage";
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

	const sliderFill =
		((targetPercentage - MIN_TARGET_PERCENTAGE) /
			(MAX_TARGET_PERCENTAGE - MIN_TARGET_PERCENTAGE)) *
		100;

	return (
		<Card className="mx-auto mb-6 card-panel--tight">
			<div className="flex flex-col md:flex-row items-center gap-3">
				<div
					className="attendance-meter"
					style={
						{
							"--ring-value": percentage,
							"--ring-color": statusMeta.color,
						} as React.CSSProperties
					}
				>
					<div className="flex flex-col items-center">
						<span className="attendance-meter__value">
							{percentage.toFixed(1)}%
						</span>
						<span className="attendance-meter__label">Overall</span>
					</div>
				</div>

				<div className="grow w-full">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h1 className="text-xl font-bold text-brutal mb-0">
							Overall Attendance
						</h1>
						<span
							className="status-pill"
							style={
								{ "--pill-color": statusMeta.color } as React.CSSProperties
							}
						>
							<statusMeta.Icon size={14} />
							{statusMeta.label}
						</span>
					</div>

					<div
						className="target-slider mt-2"
						style={{ "--slider-fill": `${sliderFill}%` } as React.CSSProperties}
					>
						<div className="flex justify-between items-center mb-1">
							<label
								htmlFor="target-percentage"
								className="text-sm font-semibold text-[var(--clay-muted)] text-brutal mb-0"
							>
								Target attendance
							</label>
							<span className="text-sm font-bold text-brutal">
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
						<div className="target-slider__scale">
							<span>{MIN_TARGET_PERCENTAGE}%</span>
							<span>{MAX_TARGET_PERCENTAGE}%</span>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
});

export default OverallAtt;
