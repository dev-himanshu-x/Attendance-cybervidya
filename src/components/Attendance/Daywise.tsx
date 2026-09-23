import { useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import type { CourseAttendancePayload } from "../../queries/useCourseAttendanceQuery";
import { useCourseAttendanceQuery } from "../../queries/useCourseAttendanceQuery";
import Badge from "../ui/Badge";
import Skeleton from "../ui/Skeleton";

interface DaywiseProps {
	token: string;
	payload: CourseAttendancePayload;
}

function formatDate(dateString: string) {
	const date = new Date(dateString);
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = String(date.getFullYear()).slice(-2);
	return `${day}-${month}-${year}`;
}

function SkeletonRow() {
	return (
		<tr>
			<td>
				<Skeleton style={{ height: "1rem", width: "4rem", margin: "0 auto" }} />
			</td>
			<td>
				<Skeleton
					style={{ height: "1rem", width: "2.5rem", margin: "0 auto" }}
				/>
			</td>
			<td>
				<Skeleton style={{ height: "1rem", width: "7rem", margin: "0 auto" }} />
			</td>
			<td>
				<Skeleton style={{ height: "1rem", width: "4rem", margin: "0 auto" }} />
			</td>
		</tr>
	);
}

function Daywise({ token, payload }: DaywiseProps) {
	const toast = useToast();
	const query = useCourseAttendanceQuery(token, payload);

	useEffect(() => {
		if (query.isError) {
			toast.error(
				"Failed to load daywise attendance data. Or this subject does not have any classes yet.",
			);
		}
	}, [query.isError, toast]);

	const lectures = query.data?.[0]?.lectureList
		? [...query.data[0].lectureList].sort(
				(a, b) =>
					new Date(b.planLecDate).getTime() - new Date(a.planLecDate).getTime(),
			)
		: [];

	const loading = query.isLoading;

	if (query.isError) return null; // toast already surfaced this
	if (!loading && lectures.length === 0)
		return <p>No daywise attendance data available.</p>;

	return (
		<div
			className="table-scroll--hidden bg-white border border-dark border-2"
			style={{ maxHeight: "500px", overflow: "auto" }}
		>
			<table className="table-brutal mb-0">
				<thead>
					<tr>
						<th>Date</th>
						<th>Day</th>
						<th>Time Slot</th>
						<th>Attendance</th>
					</tr>
				</thead>
				<tbody className={`text-center ${!loading ? "fade-in-opacity" : ""}`}>
					{loading ? (
						<>
							<SkeletonRow />
							<SkeletonRow />
							<SkeletonRow />
							<SkeletonRow />
						</>
					) : (
						lectures.map((lecture) => (
							<tr key={`${lecture.planLecDate}-${lecture.timeSlot}`}>
								<td>{formatDate(lecture.planLecDate)}</td>
								<td>{lecture.dayName.substring(0, 3)}</td>
								<td className="small">{lecture.timeSlot}</td>
								<td className="fw-semibold">
									<Badge
										size="sm"
										variant={
											lecture.attendance === "PRESENT"
												? "present"
												: lecture.attendance === "ADJUSTED"
													? "adjusted"
													: "absent"
										}
									>
										{lecture.attendance}
									</Badge>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

export default Daywise;
