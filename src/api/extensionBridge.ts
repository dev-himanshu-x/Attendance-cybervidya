// CyberVidya's firewall rejects the browser's CORS preflight, so the website
// cannot call its API from the page. The "Attendance Bridge" browser extension
// makes the requests instead; this is an axios adapter that hands each request
// to it (through the page's own message channel) and turns the reply back into
// a normal axios response. Every call in src/api/ goes through it unchanged.

import axios, {
	type AxiosAdapter,
	AxiosError,
	AxiosHeaders,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import { REQUIRED_EXTENSION_VERSION } from "@/types/constants";

export const EXTENSION_MARKER_ID = "attendance-bridge-installed";
const REQUEST_TIMEOUT_MS = 25_000;
// An extension new enough to relay requests answers within milliseconds.
const ACK_TIMEOUT_MS = 2_000;

interface BridgeReply {
	status: number;
	statusText?: string;
	contentType?: string;
	body?: string;
	error?: string;
}

let counter = 0;

function callExtension(request: {
	url: string;
	method: string;
	headers: Record<string, string>;
	body?: string;
}): Promise<BridgeReply & { outdated?: boolean }> {
	return new Promise((resolve) => {
		const id = `${Date.now()}-${++counter}`;
		let acknowledged = false;

		const finish = (reply: BridgeReply & { outdated?: boolean }) => {
			clearTimeout(ackTimer);
			clearTimeout(timer);
			window.removeEventListener("message", onMessage);
			resolve(reply);
		};
		const ackTimer = setTimeout(() => {
			if (!acknowledged) finish({ status: 0, outdated: true });
		}, ACK_TIMEOUT_MS);
		const timer = setTimeout(
			() =>
				finish({ status: 0, error: "The extension did not respond in time." }),
			REQUEST_TIMEOUT_MS,
		);

		function onMessage(event: MessageEvent) {
			if (event.source !== window || event.origin !== window.location.origin) {
				return;
			}
			const data = event.data;
			if (!data || data.source !== "attendance-bridge" || data.id !== id) {
				return;
			}
			if (data.type === "ack") {
				acknowledged = true;
				clearTimeout(ackTimer);
			} else if (data.type === "fetch-result") {
				finish(data as BridgeReply);
			}
		}

		window.addEventListener("message", onMessage);
		window.postMessage(
			{ source: "attendance-site", type: "fetch", id, request },
			window.location.origin,
		);
	});
}

function toResponse(
	config: InternalAxiosRequestConfig,
	status: number,
	statusText: string,
	body: string,
	contentType: string,
): AxiosResponse {
	return {
		data: body,
		status,
		statusText,
		headers: new AxiosHeaders({ "content-type": contentType }),
		config,
		request: {},
	};
}

// Missing or too-old extension: no call can succeed, so report it as a 403
// whose reason names the extension and the existing "install / update the
// extension" flow takes over.
function extensionProblem(
	config: InternalAxiosRequestConfig,
	reason: string,
): AxiosError {
	return new AxiosError(
		reason,
		AxiosError.ERR_BAD_REQUEST,
		config,
		{},
		toResponse(
			config,
			403,
			"Forbidden",
			JSON.stringify({ error: { reason } }),
			"application/json",
		),
	);
}

function isOlderThanRequired(version: string | undefined): boolean {
	if (!version) return true;
	const have = version.split(".").map(Number);
	const need = REQUIRED_EXTENSION_VERSION.split(".").map(Number);
	for (let i = 0; i < Math.max(have.length, need.length); i++) {
		const a = have[i] ?? 0;
		const b = need[i] ?? 0;
		if (a !== b) return a < b;
	}
	return false;
}

export const extensionAdapter: AxiosAdapter = async (config) => {
	const marker = document.getElementById(EXTENSION_MARKER_ID);
	if (!marker) {
		throw extensionProblem(config, "Attendance Bridge extension not detected.");
	}
	const installed = marker.getAttribute("data-version") ?? undefined;
	if (isOlderThanRequired(installed)) {
		throw extensionProblem(
			config,
			`Attendance Bridge extension is out of date (found ${installed ?? "an old version"}, need ${REQUIRED_EXTENSION_VERSION}).`,
		);
	}

	const headers: Record<string, string> = {};
	const source = AxiosHeaders.from(config.headers).toJSON();
	for (const [name, value] of Object.entries(source)) {
		if (value !== undefined && value !== null) headers[name] = String(value);
	}

	const reply = await callExtension({
		url: axios.getUri(config),
		method: (config.method ?? "get").toUpperCase(),
		headers,
		body: typeof config.data === "string" ? config.data : undefined,
	});

	if (reply.outdated) {
		throw extensionProblem(
			config,
			"Attendance Bridge extension did not answer. Reload the extension on chrome://extensions, then reload this page.",
		);
	}
	if (!reply.status) {
		throw new AxiosError(
			`Attendance Bridge: ${reply.error ?? "could not reach CyberVidya."}`,
			AxiosError.ERR_NETWORK,
			config,
			{},
		);
	}

	const response = toResponse(
		config,
		reply.status,
		reply.statusText ?? "",
		reply.body ?? "",
		reply.contentType ?? "",
	);
	const ok = config.validateStatus ? config.validateStatus(reply.status) : true;
	if (ok) return response;
	throw new AxiosError(
		`Request failed with status code ${reply.status}`,
		reply.status >= 500
			? AxiosError.ERR_BAD_RESPONSE
			: AxiosError.ERR_BAD_REQUEST,
		config,
		{},
		response,
	);
};
