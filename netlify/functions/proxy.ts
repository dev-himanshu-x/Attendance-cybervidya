import type { Handler } from "@netlify/functions";

// Mirrors api/proxy.ts (the Vercel relay). CyberVidya's WAF currently blocks
// Cloudflare and Vercel egress ranges but not Netlify's, so this is kept as
// a second, independent relay (see netlify.toml for the /api/* redirect).
const UPSTREAM = "https://kiet.cybervidya.net";

// This proxy is cross-origin from the Vercel-hosted frontend (unlike
// api/proxy.ts, which is same-origin), so every response needs CORS headers.
const CORS_HEADERS = {
	"access-control-allow-origin": "*",
	"access-control-allow-headers": "content-type, authorization",
	"access-control-allow-methods": "GET, POST, OPTIONS",
};

export const handler: Handler = async (event) => {
	if (event.httpMethod === "OPTIONS") {
		return { statusCode: 204, headers: CORS_HEADERS, body: "" };
	}

	const params = new URLSearchParams(
		(event.queryStringParameters ?? {}) as Record<string, string>,
	);
	const path = params.get("path") ?? "";
	params.delete("path");
	const query = params.toString();
	const targetUrl = `${UPSTREAM}/api/${path}${query ? `?${query}` : ""}`;

	// Node's bare fetch sends no User-Agent/Accept at all, unlike every real
	// HTTP client (browsers, axios, mobile apps) — add our own, honestly
	// labeled, since some WAFs reject header-less requests outright.
	const headers: Record<string, string> = {
		"user-agent":
			"CyberVidyaAttendanceViewer/1.0 (+https://github.com/dev-himanshu-x/Attendance-cybervidya)",
		accept: "application/json, text/plain, */*",
	};
	const contentType = event.headers["content-type"];
	const authorization = event.headers.authorization;
	if (contentType) headers["content-type"] = contentType;
	if (authorization) headers.authorization = authorization;

	const method = event.httpMethod;
	const hasBody = method !== "GET" && method !== "HEAD";
	const body =
		hasBody && event.body
			? event.isBase64Encoded
				? Buffer.from(event.body, "base64").toString("utf-8")
				: event.body
			: undefined;

	let upstreamResponse: Response;
	try {
		upstreamResponse = await fetch(targetUrl, { method, headers, body });
	} catch {
		return {
			statusCode: 502,
			headers: { ...CORS_HEADERS, "content-type": "application/json" },
			body: JSON.stringify({
				error: { reason: "Unable to reach CyberVidya." },
			}),
		};
	}

	const responseContentType =
		upstreamResponse.headers.get("content-type") ?? "application/json";
	const responseBody = await upstreamResponse.text();

	return {
		statusCode: upstreamResponse.status,
		headers: { ...CORS_HEADERS, "content-type": responseContentType },
		body: responseBody,
	};
};
