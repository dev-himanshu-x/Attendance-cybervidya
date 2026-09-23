import axios from "axios";
import type {
	AttendanceApiResponse,
	StudentAttendanceApiResponse,
	StudentDetails,
} from "../types/response";
import { authHeaders, getBaseUrl } from "./client";

export async function fetchAttendanceData(
	token: string,
): Promise<StudentDetails> {
	try {
		const attendanceResponse = await axios.get<StudentAttendanceApiResponse>(
			`${getBaseUrl()}/api/attendance/course/component/student`,
			{ headers: authHeaders(token) },
		);
		return attendanceResponse.data.data;
	} catch (err: unknown) {
		if (axios.isAxiosError(err) && err.response?.status === 401) {
			throw new Error("Session expired. Please login again.");
		}
		const errorMessage =
			err instanceof Error
				? err.message
				: typeof err === "string"
					? err
					: JSON.stringify(err);
		throw new Error(`Failed to fetch attendance data: ${errorMessage}`);
	}
}

export async function fetchStudentId(token: string): Promise<number | null> {
	const response = await axios.get(
		`${getBaseUrl()}/api/student/dashboard/registered-courses`,
		{ headers: authHeaders(token) },
	);

	if (response.data.data.length > 0) {
		return response.data.data[0].studentId;
	}
	return null;
}

export async function fetchCourseAttendance(
	token: string,
	payload: {
		courseCompId: number;
		courseId: number;
		sessionId: number | null;
		studentId: number | string;
	},
) {
	const response = await axios.post<AttendanceApiResponse>(
		`${getBaseUrl()}/api/attendance/schedule/student/course/attendance/percentage`,
		payload,
		{
			headers: {
				"Content-Type": "application/json",
				...authHeaders(token),
			},
		},
	);
	return response.data.data;
}
