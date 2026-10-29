import type { VercelRequest, VercelResponse } from "@vercel/node";

// CyberVidya's API doesn't allow direct cross-origin browser requests, so
// every /api/* call from the frontend lands here and gets relayed to the
// real ERP from this function's own (non-Cloudflare) network instead.
const UPSTREAM = "https://kiet.cybervidya.net";

function headerValue(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const targetUrl = `${UPSTREAM}${req.url}`;

	const headers: Record<string, string> = {};
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
