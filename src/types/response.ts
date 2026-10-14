// Login (encrypt) Response - supports direct token return and OTP challenge fallback
export interface EncryptLoginResponse {
	token?: string;
	id_token?: string;
	transactionId?: string;
	message?: string;
	data?: {
		token?: string;
		transactionId?: string;
		tfaEnable?: boolean;
		maskEmail?: string;
		counter?: number | string;
		id?: number | string;
	};
}

// Login / OTP Verify Response
export interface LoginResponse {
	token?: string;
	data?: {
		token?: string;
		auth_pref?: string;
		id?: number | string;
	};
	message?: string;
}

// Attendance Data Response

export interface StudentAttendanceApiResponse {
	data: StudentDetails;
}

export interface StudentDetails {
	fullName: string;
	registrationNumber: string;
	sectionName: string;
	branchShortName: string;
	degreeName: string;
	semesterName: string;
	attendanceCourseComponentInfoList: CourseAttendanceInfo[];
}

export interface CourseAttendanceInfo {
	courseName: string;
	courseCode: string;
	courseId: number;
	attendanceCourseComponentNameInfoList: AttendanceComponentInfo[];
}

export interface AttendanceComponentInfo {
	courseComponentId: number;
	numberOfExtraAttendance: number;
	componentName: string;
	numberOfPeriods: number;
	numberOfPresent: number;
	presentPercentage: number | null;
	presentPercentageWith: string;
	isProjected: boolean;
}

// ---------------- DAYWISE-ATTENDANCE-API-RESPONSE ----------------

export interface DaywiseReportProps {
	token: string;
	payload: {
		courseCompId: number;
		courseId: number;
		sessionId: number | null;
		studentId: number | string;
	};
}

export interface LectureListProps {
	planLecDate: string;
	dayName: string;
	timeSlot: string;
	attendance: "PRESENT" | "ADJUSTED" | "ABSENT";
}

export interface AttendanceApiResponse {
	data: {
		lectureList: LectureListProps[];
	}[];
}

// --- Types for the 'What-if' Projection feature ---

export interface ScheduleEntry {
	id: string | null;
	start: string;
	end: string;
	title: string;
	courseName: string;
	courseCode: string;
	courseCompName: string;
	facultyName: string;
	lectureDate: string | null; // e.g., "10/01/2024"
	type: "CLASS" | "HOLIDAY";
	classRoom: string;
}

export interface ScheduleResponse {
	data: ScheduleEntry[];
	message: string;
}
