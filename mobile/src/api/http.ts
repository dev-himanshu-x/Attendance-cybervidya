// Requests to CyberVidya run through `bridge.ts` — inside a hidden browser view
// showing CyberVidya's own page — because its firewall refuses requests from
// anything that isn't a real browser. Request bodies can hold sensitive data,
// so nothing here logs them.
import { bridgeFetch } from "./bridge";
import { ApiError } from "./core";

export { ApiError, BASE_URL, isBlockedStatus } from "./core";

interface RequestOptions {
	method?: "GET" | "POST";
	token?: string | null;
	body?: unknown;
	params?: Record<string, string>;
	timeoutMs?: number;
}

function buildQuery(params?: Record<string, string>): string {
	if (!params) return "";
	const pairs = Object.entries(params).map(
		([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
	);
	return pairs.length > 0 ? `?${pairs.join("&")}` : "";
}

export async function request<T>(
	path: string,
	{
		method = "GET",
		token,
		body,
		params,
		timeoutMs = 15_000,
	}: RequestOptions = {},
): Promise<T> {
	const headers: Record<string, string> = { Accept: "application/json" };
	if (body !== undefined) headers["Content-Type"] = "application/json";
	if (token) headers.Authorization = `GlobalEducation ${token}`;

	const response = await bridgeFetch({
		path: `${path}${buildQuery(params)}`,
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
		timeoutMs,
	});

	let data: unknown = null;
	try {
		data = response.text ? JSON.parse(response.text) : null;
	} catch {
		// Non-JSON body (e.g. a firewall's plain-text "Blocked" page).
	}

	if (response.status < 200 || response.status >= 300) {
		const reason =
			(data as { error?: { reason?: string } } | null)?.error?.reason ?? null;
		throw new ApiError(
			response.status,
			reason,
			reason ?? `CyberVidya replied with an error (${response.status}).`,
		);
	}
	return data as T;
}
