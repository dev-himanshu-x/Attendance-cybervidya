import type { NextRequest } from "next/server";

// CyberVidya's API doesn't allow direct cross-origin browser requests, so
// every /api/* call from the frontend is handled here and relayed to the
// real ERP from this route's own, non-Cloudflare network instead.
const UPSTREAM = "https://kiet.cybervidya.net";

export const dynamic = "force-dynamic";

async function relay(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
	const { path } = await params;
	const targetUrl = `${UPSTREAM}/api/${path.join("/")}${req.nextUrl.search}`;

	// Node's bare fetch sends no User-Agent/Accept at all, unlike every real
	// HTTP client (browsers, axios, mobile apps) — add our own, honestly
	// labeled, since some WAFs reject header-less requests outright.
	const headers: Record<string, string> = {
		"user-agent":
			"CyberVidyaAttendanceViewer/1.0 (+https://github.com/dev-himanshu-x/Attendance-cybervidya)",
		accept: "application/json, text/plain, */*",
	};
	const contentType = req.headers.get("content-type");
	const authorization = req.headers.get("authorization");
	if (contentType) headers["content-type"] = contentType;
	if (authorization) headers.authorization = authorization;

	const hasBody = req.method !== "GET" && req.method !== "HEAD";

	let upstreamResponse: Response;
	try {
		upstreamResponse = await fetch(targetUrl, {
			method: req.method,
			headers,
			body: hasBody ? await req.text() : undefined,
			cache: "no-store",
		});
	} catch {
		return Response.json(
			{ error: { reason: "Unable to reach CyberVidya." } },
			{ status: 502 },
		);
	}

	const responseHeaders = new Headers();
	const responseContentType = upstreamResponse.headers.get("content-type");
	if (responseContentType)
		responseHeaders.set("content-type", responseContentType);

	return new Response(await upstreamResponse.text(), {
		status: upstreamResponse.status,
		headers: responseHeaders,
	});
}

export {
	relay as DELETE,
	relay as GET,
	relay as PATCH,
	relay as POST,
	relay as PUT,
};
