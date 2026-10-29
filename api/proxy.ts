import type { VercelRequest, VercelResponse } from "@vercel/node";

// CyberVidya's API doesn't allow direct cross-origin browser requests, so
// every /api/* call from the frontend is rewritten here (see vercel.json)
// and relayed to the real ERP from this function's own, non-Cloudflare
// network instead.
const UPSTREAM = "https://kiet.cybervidya.net";

function headerValue(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

function buildUpstreamUrl(req: VercelRequest): string {
	const { path, ...rest } = req.query;
	const segments = Array.isArray(path) ? path.join("/") : (path ?? "");

	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(rest)) {
		if (Array.isArray(value)) {
			for (const v of value) search.append(key, v);
		} else if (value !== undefined) {
			search.append(key, value);
		}
	}

	const query = search.toString();
	return `${UPSTREAM}/api/${segments}${query ? `?${query}` : ""}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const targetUrl = buildUpstreamUrl(req);

	// Node's bare fetch sends no User-Agent/Accept at all, unlike every real
	// HTTP client (browsers, axios, mobile apps) — add our own, honestly
	// labeled, since some WAFs reject header-less requests outright.
	const headers: Record<string, string> = {
		"user-agent":
			"CyberVidyaAttendanceViewer/1.0 (+https://github.com/dev-himanshu-x/Attendance-cybervidya)",
		accept: "application/json, text/plain, */*",
	};
	const contentType = headerValue(req.headers["content-type"]);
	const authorization = headerValue(req.headers.authorization);
	if (contentType) headers["content-type"] = contentType;
	if (authorization) headers.authorization = authorization;

	const hasBody = req.method !== "GET" && req.method !== "HEAD";

	let upstreamResponse: Response;
	try {
		upstreamResponse = await fetch(targetUrl, {
			method: req.method,
			headers,
			body:
				hasBody && req.body !== undefined
					? JSON.stringify(req.body)
					: undefined,
		});
	} catch {
		res.status(502).json({ error: { reason: "Unable to reach CyberVidya." } });
		return;
	}

	const responseContentType = upstreamResponse.headers.get("content-type");
	if (responseContentType) res.setHeader("content-type", responseContentType);

	const body = await upstreamResponse.text();
	res.status(upstreamResponse.status).send(body);
}
