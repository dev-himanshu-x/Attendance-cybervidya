import Cookies from "js-cookie";
import { CalendarDays, LayoutGrid, SearchX, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthToken } from "../../hooks/useAuthToken";
import { useAttendanceQuery } from "../../queries/useAttendanceQuery";
import { useScheduleQuery } from "../../queries/useScheduleQuery";
import { useStudentIdQuery } from "../../queries/useStudentIdQuery";
import { COOKIE_EXPIRY, STUDENT_ID_COOKIE_NAME } from "../../types/constants";
import type {
	AttendanceComponentInfo,
	CourseAttendanceInfo,
} from "../../types/response";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import CalendarView from "./CalendarView";
import CourseCard from "./CourseCard";
import Daywise from "./Daywise";
import OverallAtt from "./OverallAtt";
import Profile from "./Profile";
import Projections from "./Projections";
import TodayClasses from "./TodayClasses";

export interface SelectedComponentType {
	course: CourseAttendanceInfo;
	component: AttendanceComponentInfo;
}

interface AttendanceProps {
	searchQuery: string;
}

function Attendance({ searchQuery }: AttendanceProps) {
	const { token } = useAuthToken();
	const attendanceQuery = useAttendanceQuery(token);
	const attendanceData = attendanceQuery.data ?? null;
	const scheduleQuery = useScheduleQuery(token);

	const [studentId, setStudentId] = useState<number | null>(() => {
		const cookieStudentId = Cookies.get(STUDENT_ID_COOKIE_NAME);
		return cookieStudentId ? Number(cookieStudentId) : null;
	});

	const studentIdQuery = useStudentIdQuery(token, studentId === null);

	useEffect(() => {
		if (attendanceData === null) {
			setStudentId(null);
		}
	}, [attendanceData]);

	useEffect(() => {
		if (studentIdQuery.data) {
			setStudentId(studentIdQuery.data);
			Cookies.set(STUDENT_ID_COOKIE_NAME, String(studentIdQuery.data), {
				expires: COOKIE_EXPIRY,
			});
		}
	}, [studentIdQuery.data]);

	const [selectedComponent, setSelectedComponent] =
		useState<SelectedComponentType | null>(null);
	const [isDaywiseModalOpen, setIsDaywiseModalOpen] = useState(false);
	const [isProjectionVisible, setIsProjectionVisible] = useState(false);
	const [viewMode, setViewMode] = useState<"card" | "calendar">("card");
	const projectionRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isProjectionVisible) {
			requestAnimationFrame(() => {
				projectionRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			});
		}
	}, [isProjectionVisible]);

	const handleViewDaywiseAttendance = useCallback(
		(
			course: SelectedComponentType["course"],
			component: SelectedComponentType["component"],
		) => {
			setSelectedComponent({ course, component });
			setIsDaywiseModalOpen(true);
		},
		[],
	);

	useEffect(() => {
		// Scroll to the top after login
		window.scrollTo({ top: 0, behavior: "instant" });
	}, []);

	const trimmedSearchQuery = searchQuery.trim();
	const isSearching = trimmedSearchQuery.length > 0;

	const filteredCourses = useMemo(() => {
		const list = attendanceData?.attendanceCourseComponentInfoList ?? [];
		const query = trimmedSearchQuery.toLowerCase();
		if (!query) return list;
		return list.filter(
			(course) =>
				course.courseName.toLowerCase().includes(query) ||
				course.courseCode.toLowerCase().includes(query),
		);
	}, [attendanceData, trimmedSearchQuery]);

	if (!attendanceData) return null;

	return (
		<div className="flex-grow-1 d-flex flex-column">
			<div className="container-fluid px-3 px-lg-4 py-4">
				{isSearching ? (
					<div id="search-results">
						<h2 className="fs-5 fw-bold text-brutal mb-4">
							Search results for "{trimmedSearchQuery}"
						</h2>
						{filteredCourses.length === 0 ? (
							<div className="d-flex flex-column align-items-center text-center text-secondary py-5">
								<SearchX size={36} className="mb-3" />
								<p className="fw-semibold text-brutal mb-1">
									No courses match "{trimmedSearchQuery}"
								</p>
								<p className="small mb-0">
									Try a different course name or code.
								</p>
							</div>
						) : (
							<div className="row g-4">
								{filteredCourses.map((course) => (
									<div
										className="col-12 col-md-6 col-lg-4"
										key={course.courseCode}
									>
										<CourseCard
											onViewDaywiseAttendance={handleViewDaywiseAttendance}
											course={course}
										/>
									</div>
								))}
							</div>
						)}
					</div>
				) : (
					<>
						<div id="overview" className="mb-4">
							<Profile attendanceData={attendanceData} />
						</div>

						<div id="attendance">
							<OverallAtt attendanceData={attendanceData} />
						</div>

						<div className="row g-4 mb-4">
							<div className="col-12">
								<TodayClasses
									token={token}
									studentId={studentId}
									attendanceData={attendanceData}
									schedule={scheduleQuery.data ?? []}
									isLoading={scheduleQuery.isLoading}
									isProjectionVisible={isProjectionVisible}
									onToggleProjection={() =>
										setIsProjectionVisible((prev) => !prev)
									}
								/>
							</div>
						</div>

						{isProjectionVisible && (
							<div ref={projectionRef}>
								<Projections
									token={token}
									schedule={scheduleQuery.data ?? []}
									onClose={() => setIsProjectionVisible(false)}
								/>
							</div>
						)}

						<div id="courses">
							{/* View Mode Toggle */}
							<div className="d-flex align-items-center justify-content-end gap-2 mb-4">
								<Button
									variant="outline"
									active={viewMode === "card"}
									icon={<LayoutGrid size={14} />}
									hideTextOnMobile
									onClick={() => setViewMode("card")}
								>
									Card View
								</Button>
								<Button
									variant="outline"
									active={viewMode === "calendar"}
									icon={<CalendarDays size={14} />}
									hideTextOnMobile
									onClick={() => setViewMode("calendar")}
								>
									Calendar View
								</Button>
							</div>

							{viewMode === "card" ? (
								<div className="row g-4">
									{filteredCourses.map((course) => (
										<div
											className="col-12 col-md-6 col-lg-4"
											key={course.courseCode}
										>
											<CourseCard
												onViewDaywiseAttendance={handleViewDaywiseAttendance}
												course={course}
											/>
										</div>
									))}
								</div>
							) : (
								<CalendarView
									token={token ?? ""}
									studentId={studentId || 0}
									attendanceData={attendanceData}
								/>
							)}
						</div>
					</>
				)}

				{/* Modal to show daywise attendance */}
				{isDaywiseModalOpen && selectedComponent && (
					<Modal variant="soft" onClose={() => setIsDaywiseModalOpen(false)}>
						<div className="d-flex justify-content-between align-items-center mb-3">
							<h2 className="fs-5 mb-0">
								Daywise Attendance for{" "}
								<span className="fw-bold">
									{selectedComponent.course.courseName} -{" "}
									{selectedComponent.component.componentName}
								</span>
							</h2>
							<button
								type="button"
								className="btn-brutal btn-brutal--plain text-danger fs-4"
								onClick={() => setIsDaywiseModalOpen(false)}
							>
								<X />
							</button>
						</div>

						<Daywise
							token={token ?? ""}
							payload={{
								courseCompId: selectedComponent.component.courseComponentId,
								courseId: selectedComponent.course.courseId,
								sessionId: null,
								studentId: studentId || 0,
							}}
						/>
					</Modal>
				)}
			</div>
		</div>
	);
}

export default Attendance;
