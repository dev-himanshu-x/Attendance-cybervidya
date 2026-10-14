import axios from "axios";
import CryptoJS from "crypto-js";
import type { EncryptLoginResponse, LoginResponse } from "../types/response";
import { getBaseUrl } from "./client";

export function encryptPassword(plaintext: string): string {
	const key = CryptoJS.enc.Base64.parse("NPdLWA5w7yFQhPeUuKmO/A==");
	const iv = CryptoJS.enc.Base64.parse("bV5V6nK4phvQG9ZhkAjugQ==");

	const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
		iv,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
	});

	return encrypted.toString();
}

export interface ApiErrorResponse {
	error?: {
		reason?: string;
	};
}

export function getServerErrorReason(err: unknown): string | null {
	if (axios.isAxiosError(err)) {
		const data = err.response?.data as ApiErrorResponse | undefined;
		return data?.error?.reason ?? null;
	}
	return null;
}

export type LoginResult =
	| { kind: "token"; token: string }
	| { kind: "otp"; transactionId: string };

export async function login(
	username: string,
	password: string,
): Promise<LoginResult> {
	// 1. Direct login (bypasses OTP). If CyberVidya explicitly rejects the
	// credentials (400), propagate instead of retrying.
	try {
		const direct = await axios.post<LoginResponse>(
			`${getBaseUrl()}/api/auth/login`,
			{ userName: username, password },
		);
		const token = direct.data.token || direct.data.data?.token;
		if (token) return { kind: "token", token };
	} catch (err) {
		if (axios.isAxiosError(err) && err.response?.status === 400) throw err;
	}

	// 2. Fallback: encrypted login, which may return a token or an OTP challenge.
	const response = await axios.post<EncryptLoginResponse>(
		`${getBaseUrl()}/api/auth/encrypt/login`,
		{
			userName: encryptPassword(username),
			password: encryptPassword(password),
			device: "WEB",
			version: null,
			reCaptchaToken: null,
		},
	);
	const body = response.data;
	const token = body.token || body.data?.token || body.id_token;
	if (token) return { kind: "token", token };

	const transactionId = body.transactionId || body.data?.transactionId;
	if (
		transactionId ||
		(typeof body.message === "string" &&
			body.message.toLowerCase().includes("otp"))
	) {
		return { kind: "otp", transactionId: transactionId ?? "" };
	}

	throw new Error(
		body.message || "Unexpected response from CyberVidya during login.",
	);
}

export async function verifyOtp(otp: string, transactionId: string) {
	const response = await axios.post<LoginResponse>(
		`${getBaseUrl()}/api/auth/verify/otp`,
		{
			otp,
			transactionId,
			device: "WEB",
			version: null,
		},
	);
	const token = response.data.token || response.data.data?.token;
	if (!token) {
		throw new Error(
			response.data.message ||
				"Invalid or missing token from OTP verification.",
		);
	}
	return token;
}
