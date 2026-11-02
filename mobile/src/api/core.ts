export const BASE_URL = "https://kiet.cybervidya.net";

export class ApiError extends Error {
	readonly status: number;
	readonly reason: string | null;

	constructor(status: number, reason: string | null, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.reason = reason;
	}
}

// CyberVidya rate-limits and flags bursts of requests, so callers stop
// immediately on any of these instead of retrying.
export function isBlockedStatus(err: unknown): boolean {
	return err instanceof ApiError && [401, 403, 429].includes(err.status);
}
