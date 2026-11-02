const ERP_HOSTNAME = "kiet.cybervidya.net";

function isWebsiteHost(hostname) {
	return (
		hostname === "cyberviydakiet.vercel.app" ||
		hostname === "localhost" ||
		hostname === "127.0.0.1"
	);
}

/**
 * Website side: injects the detection marker (and version) the app looks
 * for, then relays the app's API requests.
 */
function handleWebsite() {
	// Runs at document_start, before the page's own scripts, so the site knows
	// about the extension from its very first render. The marker goes on the
	// root element because <body> does not exist yet.
	const root = document.documentElement;
	const version = chrome.runtime.getManifest().version;
	root.setAttribute("data-attendance-bridge", version);
	if (!document.getElementById("attendance-bridge-installed")) {
		const marker = document.createElement("div");
		marker.id = "attendance-bridge-installed";
		marker.style.display = "none";
		marker.setAttribute("aria-hidden", "true");
		// Lets the website detect outdated installs and prompt users to update.
		marker.setAttribute("data-version", version);
		root.appendChild(marker);
	}

	relayApiRequests();
}

/**
 * Website side: relays the site's API requests to the background script,
 * which makes them (CyberVidya's firewall rejects the browser's CORS
 * preflight, so the page cannot call the API directly). Only messages from
 * this very page are honoured, and the background script re-checks the URL.
 */
function relayApiRequests() {
	window.addEventListener("message", (event) => {
		if (event.source !== window || event.origin !== window.location.origin) {
			return;
		}
		const data = event.data;
		if (
			!data ||
			data.source !== "attendance-site" ||
			data.type !== "fetch" ||
			typeof data.id !== "string"
		) {
			return;
		}
		// Tell the page at once that the extension received the request, so
		// it can tell "extension too old to answer" from "still waiting".
		window.postMessage(
			{ source: "attendance-bridge", type: "ack", id: data.id },
			window.location.origin,
		);
		const reply = (payload) =>
			window.postMessage(
				{
					source: "attendance-bridge",
					type: "fetch-result",
					id: data.id,
					...payload,
				},
				window.location.origin,
			);
		try {
			chrome.runtime.sendMessage(
				{ type: "bridge-fetch", request: data.request },
				(response) => {
					if (chrome.runtime.lastError || !response) {
						reply({
							status: 0,
							error:
								(chrome.runtime.lastError &&
									chrome.runtime.lastError.message) ||
								"No response from the extension.",
						});
						return;
					}
					reply(response);
				},
			);
		} catch (error) {
			reply({ status: 0, error: String(error) });
		}
	});
}

/**
 * CyberVidya side: makes API requests for the extension's background script.
 * Running here, they are ordinary same-origin requests from this page. Only
 * messages from this extension are honoured, and only for the API.
 */
function serveApiRequests() {
	// Only the top frame answers tab messages, so one request is never made
	// twice by a frame inside the page.
	if (window !== window.top) return;
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (sender.id !== chrome.runtime.id || !message) return false;
		if (message.type === "erp-ping") {
			sendResponse({ ready: true });
			return false;
		}
		if (message.type !== "erp-fetch") return false;

		const { url, method, headers, body } = message.request || {};
		if (typeof url !== "string" || !url.startsWith(`${location.origin}/api/`)) {
			sendResponse({ status: 0, error: "Request not allowed." });
			return false;
		}
		fetch(url, { method, headers, body })
			.then(async (response) =>
				sendResponse({
					status: response.status,
					statusText: response.statusText,
					contentType: response.headers.get("content-type") || "",
					body: await response.text(),
				}),
			)
			.catch((error) => sendResponse({ status: 0, error: String(error) }));
		return true;
	});
}

/**
 * CyberVidya frame inside the extension's hidden page: connects to the
 * background script and answers its requests from here (same origin).
 */
function serveHiddenFrame() {
	// Only frames: the background script accepts the connection only from a
	// frame that belongs to the extension's own hidden page, never from one in
	// an ordinary tab, and says so with "hello".
	if (window === window.top) return;
	const connect = () => {
		const port = chrome.runtime.connect({ name: "erp-frame" });
		let accepted = false;
		port.onMessage.addListener(async (message) => {
			if (message.type === "hello") {
				accepted = true;
				return;
			}
			if (message.type !== "erp-fetch") return;
			const { url, method, headers, body } = message.request || {};
			let reply;
			if (
				typeof url !== "string" ||
				!url.startsWith(`${location.origin}/api/`)
			) {
				reply = { status: 0, error: "Request not allowed." };
			} else {
				try {
					const response = await fetch(url, { method, headers, body });
					reply = {
						status: response.status,
						statusText: response.statusText,
						contentType: response.headers.get("content-type") || "",
						body: await response.text(),
					};
				} catch (error) {
					reply = { status: 0, error: String(error) };
				}
			}
			port.postMessage({ id: message.id, reply });
		});
		// The background script can be stopped and restarted; keep the link,
		// but only if it had accepted this frame in the first place.
		port.onDisconnect.addListener(() => {
			if (accepted) setTimeout(connect, 500);
		});
	};
	connect();
}

const hostname = window.location.hostname;
if (isWebsiteHost(hostname)) {
	handleWebsite();
} else if (hostname === ERP_HOSTNAME) {
	serveApiRequests();
	serveHiddenFrame();
}
