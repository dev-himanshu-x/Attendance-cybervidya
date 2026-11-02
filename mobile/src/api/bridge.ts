// CyberVidya's firewall refuses requests that don't come from a real browser,
// including this app's own network stack. So API calls are made *inside* a
// hidden browser view that has CyberVidya's own page open: the request is a
// genuine same-origin call from a genuine browser, exactly like the website's
// own. Nothing is forged — the page really is CyberVidya's, and the student
// really is signed in. The view is mounted by `DataBridge`.
import { ApiError, BASE_URL } from "./core";

export interface BridgeRequest {
	path: string;
	method: "GET" | "POST";
	headers: Record<string, string>;
	body?: string;
	timeoutMs: number;
}

export interface BridgeResponse {
	status: number;
	text: string;
}

interface Pending {
	resolve: (value: BridgeResponse) => void;
	reject: (reason: Error) => void;
	timer: ReturnType<typeof setTimeout>;
}

interface Deferred {
	promise: Promise<void>;
	resolve: () => void;
	reject: (reason: Error) => void;
}

function deferred(): Deferred {
	let resolve!: () => void;
	let reject!: (reason: Error) => void;
	const promise = new Promise<void>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	// A rejection nobody is waiting on yet must not surface as unhandled.
	promise.catch(() => {});
	return { promise, resolve, reject };
}

let ready = deferred();
let isReady = false;
let runScript: ((js: string) => void) | null = null;
let counter = 0;
const pending = new Map<number, Pending>();

export function attachBridge(run: (js: string) => void) {
	runScript = run;
}

export function bridgeLoading() {
	if (isReady) {
		ready = deferred();
		isReady = false;
	}
}

export function bridgeReady() {
	isReady = true;
	ready.resolve();
}

export function bridgeFailed(status: number) {
	const error =
		status === 403
			? new ApiError(
					403,
					null,
					"CyberVidya's firewall refused this request (403).",
				)
			: new ApiError(
					status,
					null,
					status === 0
						? "Can't reach CyberVidya. Check your connection and try again."
						: `CyberVidya replied with an error (${status}).`,
				);
	ready.reject(error);
	for (const [id, p] of pending) {
		clearTimeout(p.timer);
		p.reject(error);
		pending.delete(id);
	}
}

// Sign-out: drop everything and start clean for the next session.
export function resetBridge() {
	const error = new ApiError(0, null, "Signed out.");
	for (const [id, p] of pending) {
		clearTimeout(p.timer);
		p.reject(error);
		pending.delete(id);
	}
	runScript = null;
	isReady = false;
	ready = deferred();
}

export function handleBridgeMessage(raw: string, origin: string) {
	// Only trust replies from CyberVidya's own page.
	if (!origin.startsWith(BASE_URL)) return;
	try {
		const message = JSON.parse(raw);
		if (message.type !== "bridge") return;
		const entry = pending.get(message.id);
		if (!entry) return;
		pending.delete(message.id);
		clearTimeout(entry.timer);
		if (typeof message.status === "number") {
			entry.resolve({
				status: message.status,
				text: String(message.text ?? ""),
			});
		} else {
			entry.reject(
				new ApiError(
					0,
					null,
					"Can't reach CyberVidya. Check your connection and try again.",
				),
			);
		}
	} catch {
		// Not one of our messages.
	}
}

function buildScript(id: number, req: BridgeRequest): string {
	const payload = JSON.stringify({
		url: `${BASE_URL}${req.path}`,
		method: req.method,
		headers: req.headers,
		body: req.body,
	});
	return `(function () {
	var id = ${id};
	var req = ${payload};
	function send(extra) {
		extra.type = "bridge";
		extra.id = id;
		window.ReactNativeWebView.postMessage(JSON.stringify(extra));
	}
	fetch(req.url, { method: req.method, headers: req.headers, body: req.body })
		.then(function (r) {
			return r.text().then(function (t) { send({ status: r.status, text: t }); });
		})
		.catch(function (e) { send({ error: String(e) }); });
})();
true;`;
}

export async function bridgeFetch(req: BridgeRequest): Promise<BridgeResponse> {
	await ready.promise;
	return new Promise<BridgeResponse>((resolve, reject) => {
		if (!runScript) {
			reject(new ApiError(0, null, "Signed out."));
			return;
		}
		const id = ++counter;
		const timer = setTimeout(() => {
			pending.delete(id);
			reject(
				new ApiError(
					0,
					null,
					"CyberVidya took too long to respond. Check your connection and try again.",
				),
			);
		}, req.timeoutMs);
		pending.set(id, { resolve, reject, timer });
		runScript(buildScript(id, req));
	});
}
