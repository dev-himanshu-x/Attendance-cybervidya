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
		<div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-4">
			<div>
				<h1
					className="font-semibold mb-2 text-brutal"
					style={{ fontSize: "1.75rem" }}
				>
					{getGreeting()}, {attendanceData.fullName}!
				</h1>
				<p className="font-semibold text-brutal mb-0">
					{attendanceData.registrationNumber}
				</p>
			</div>
			<div className="sm:text-right">
				<p className="font-semibold text-brutal mb-1">
					{attendanceData.branchShortName} - Section{" "}
					{attendanceData.sectionName}
				</p>
				<p className="font-semibold text-brutal mb-0">
					{attendanceData.degreeName} | Semester {attendanceData.semesterName}
				</p>
			</div>
		</div>
	);
}
