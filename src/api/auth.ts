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

export async function login(username: string, password: string) {
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
	return response.data.data;
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
	return response.data.data;
}
