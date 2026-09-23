import type { StudentDetails } from "../../types/response";

interface ProfileProps {
	attendanceData: StudentDetails | null;
}

function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}

export default function Profile({ attendanceData }: ProfileProps) {
	if (!attendanceData) return null;

	return (
		<div className="d-flex flex-column flex-sm-row align-items-start justify-content-sm-between gap-2 gap-sm-3">
			<div>
				<h1
					className="fw-semibold mb-2 text-brutal"
					style={{ fontSize: "1.75rem" }}
				>
					{getGreeting()}, {attendanceData.fullName}!
				</h1>
				<p className="fw-semibold text-brutal mb-0">
					{attendanceData.registrationNumber}
				</p>
			</div>
			<div className="text-sm-end">
				<p className="fw-semibold text-brutal mb-1">
					{attendanceData.branchShortName} - Section{" "}
					{attendanceData.sectionName}
				</p>
				<p className="fw-semibold text-brutal mb-0">
					{attendanceData.degreeName} | Semester {attendanceData.semesterName}
				</p>
			</div>
		</div>
	);
}
