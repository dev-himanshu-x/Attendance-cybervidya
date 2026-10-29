// Netlify Edge Function: runs on Netlify's own Deno-based edge network,
// not AWS Lambda (unlike netlify/functions/* or Vercel serverless
// functions) — kept as a separate network path in case CyberVidya's WAF
// is blocking by underlying cloud provider rather than by platform.
const UPSTREAM = "https://kiet.cybervidya.net";

const CORS_HEADERS = {
	"access-control-allow-origin": "*",
	"access-control-allow-headers": "content-type, authorization",
	"access-control-allow-methods": "GET, POST, OPTIONS",
};

export default async (request: Request) => {
	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: CORS_HEADERS });
	}

	const url = new URL(request.url);
	const targetUrl = `${UPSTREAM}${url.pathname}${url.search}`;

	// Node's/Deno's bare fetch sends no User-Agent/Accept at all, unlike
	// every real HTTP client — add our own, honestly labeled.
	const headers = new Headers({
		"user-agent":
			"CyberVidyaAttendanceViewer/1.0 (+https://github.com/dev-himanshu-x/Attendance-cybervidya)",
		accept: "application/json, text/plain, */*",
	});
	const contentType = request.headers.get("content-type");
	const authorization = request.headers.get("authorization");
	if (contentType) headers.set("content-type", contentType);
	if (authorization) headers.set("authorization", authorization);

	const hasBody = request.method !== "GET" && request.method !== "HEAD";

	let upstreamResponse: Response;
	try {
		upstreamResponse = await fetch(targetUrl, {
			method: request.method,
			headers,
			body: hasBody ? await request.text() : undefined,
		});
	} catch {
		return new Response(
			JSON.stringify({ error: { reason: "Unable to reach CyberVidya." } }),
			{
				status: 502,
				headers: { ...CORS_HEADERS, "content-type": "application/json" },
			},
		);
	}

	const responseBody = await upstreamResponse.text();
	const responseHeaders = new Headers(CORS_HEADERS);
	responseHeaders.set(
		"content-type",
		upstreamResponse.headers.get("content-type") ?? "application/json",
	);

	return new Response(responseBody, {
		status: upstreamResponse.status,
		headers: responseHeaders,
	});
};

export const config = { path: "/api/*" };
