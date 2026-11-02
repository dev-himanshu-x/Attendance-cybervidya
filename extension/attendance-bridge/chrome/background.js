// Makes CyberVidya API requests on the website's behalf.
//
// CyberVidya's firewall refuses API requests that don't come from its own
// pages — including ones made from an extension's background script — and it
// rejects the browser's CORS preflight for requests from the attendance
// website. So the request is run *inside* a real CyberVidya page: this script
// finds (or quietly opens, in a minimised window) a CyberVidya tab and asks
// the content script there to make the call. To the firewall it is an
// ordinary same-origin request from the student's own browser, using their
// own session token. Nothing is forged.
const ERP_ORIGIN = "https://kiet.cybervidya.net";
const API_PREFIX = `${ERP_ORIGIN}/api/`;
const ALLOWED_METHODS = ["GET", "POST"];
// Only these request headers are forwarded; anything else the page sets is
// dropped.
const ALLOWED_HEADERS = ["authorization", "content-type", "accept"];
const TAB_READY_TIMEOUT_MS = 25000;
const CLOSE_ALARM = "close-bridge-window";
// A hidden CyberVidya frame means no window or tab is ever shown. Chromium
// browsers hold it in an offscreen document; Firefox holds it in this
// background page, which has a DOM. Safari (no DOM here, no offscreen) falls
// back to a tab / minimised window.
const HAS_OFFSCREEN = typeof chrome.offscreen !== "undefined";
const HAS_BACKGROUND_DOM =
	!HAS_OFFSCREEN &&
	typeof document !== "undefined" &&
	typeof document.createElement === "function";
const HAS_HIDDEN_FRAME = HAS_OFFSCREEN || HAS_BACKGROUND_DOM;
const FRAME_ID = "erp-frame";
const FRAME_PORT_NAME = "erp-frame";
const CLOSE_AFTER_MINUTES = 2;

// Same list as content.js: the only pages allowed to use this bridge.
function isWebsiteOrigin(origin) {
	try {
		const { hostname, protocol } = new URL(origin);
		return (
			(protocol === "https:" && hostname === "cyberviydakiet.vercel.app") ||
			(protocol === "http:" &&
				(hostname === "localhost" || hostname === "127.0.0.1"))
		);
	} catch {
		return false;
	}
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- Hidden frame (Chromium) -------------------------------------------
// The CyberVidya page inside the hidden document connects back to us over a
// port; requests go to it, and it answers from inside that page.
let framePort = null;
let portWaiters = [];
const framePending = new Map();
let frameCounter = 0;

chrome.runtime.onConnect.addListener((port) => {
	// Only our own content script, in a CyberVidya frame that belongs to this
	// extension's hidden page — a frame in an ordinary tab has `sender.tab`.
	if (
		port.name !== FRAME_PORT_NAME ||
		port.sender?.id !== chrome.runtime.id ||
		port.sender?.tab ||
		!String(port.sender?.url || "").startsWith(`${ERP_ORIGIN}/`)
	) {
		port.disconnect();
		return;
	}
	framePort = port;
	port.postMessage({ type: "hello" });
	port.onMessage.addListener((message) => {
		const settle = framePending.get(message.id);
		if (settle) {
			framePending.delete(message.id);
			settle(message.reply);
		}
	});
	port.onDisconnect.addListener(() => {
		if (framePort === port) framePort = null;
	});
	for (const waiter of portWaiters.splice(0)) waiter(port);
});

function waitForFramePort(timeoutMs) {
	if (framePort) return Promise.resolve(framePort);
	return new Promise((resolve) => {
		const waiter = (port) => {
			clearTimeout(timer);
			resolve(port);
		};
		const timer = setTimeout(() => {
			portWaiters = portWaiters.filter((w) => w !== waiter);
			resolve(null);
		}, timeoutMs);
		portWaiters.push(waiter);
	});
}

async function ensureHiddenDocument() {
	if (HAS_OFFSCREEN) {
		const contexts = await chrome.runtime.getContexts({
			contextTypes: ["OFFSCREEN_DOCUMENT"],
		});
		if (contexts.length > 0) return;
		await chrome.offscreen.createDocument({
			url: "offscreen.html",
			reasons: ["IFRAME_SCRIPTING"],
			justification:
				"Runs CyberVidya requests inside a hidden CyberVidya page, because its firewall only accepts requests made from its own pages.",
		});
		return;
	}
	// Firefox: the background page holds the frame itself. The sandbox lets the
	// page run its scripts but stops it navigating this page away.
	if (!document.getElementById(FRAME_ID)) {
		const frame = document.createElement("iframe");
		frame.id = FRAME_ID;
		frame.title = "CyberVidya";
		frame.setAttribute(
			"sandbox",
			"allow-scripts allow-same-origin allow-forms",
		);
		frame.src = `${ERP_ORIGIN}/login`;
		document.body.appendChild(frame);
	}
}

async function closeHiddenDocument() {
	if (HAS_OFFSCREEN) {
		try {
			await chrome.offscreen.closeDocument();
		} catch {
			// Not open.
		}
	} else if (HAS_BACKGROUND_DOM) {
		const frame = document.getElementById(FRAME_ID);
		if (frame) frame.remove();
	}
}

// Returns CyberVidya's reply, or null if the hidden frame could not serve it.
async function runInHiddenFrame(request) {
	try {
		await ensureHiddenDocument();
		const port = await waitForFramePort(15000);
		if (!port) return null;
		return await new Promise((resolve) => {
			const id = ++frameCounter;
			const timer = setTimeout(() => {
				framePending.delete(id);
				resolve(null);
			}, 25000);
			framePending.set(id, (reply) => {
				clearTimeout(timer);
				resolve(reply);
			});
			port.postMessage({ type: "erp-fetch", id, request });
		});
	} catch {
		return null;
	}
}

// ---- Fallback: a tab or minimised window ---------------------------------
// Open CyberVidya in a minimised window of our own; it closes itself a couple
// of minutes after last use.
async function openOwnWindow() {
	const created = await chrome.windows.create({
		url: `${ERP_ORIGIN}/`,
		state: "minimized",
	});
	await chrome.storage.session.set({ bridgeWindowId: created.id });
	return created.tabs[0].id;
}

// Wait until the content script on that tab answers. A tab that was already
// open when this extension was installed or reloaded has no content script
// (Chrome only adds it to pages loaded afterwards), so after the first failed
// attempt, inject it by hand.
async function waitForTab(tabId, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	let injected = false;
	while (Date.now() < deadline) {
		try {
			const reply = await chrome.tabs.sendMessage(tabId, { type: "erp-ping" });
			if (reply && reply.ready) return true;
		} catch {
			// Page still loading, or no content script yet.
			if (!injected) {
				injected = true;
				try {
					await chrome.scripting.executeScript({
						target: { tabId },
						files: ["content.js"],
					});
				} catch {
					// Not injectable (still loading, discarded, or not CyberVidya).
				}
			}
		}
		await sleep(400);
	}
	return false;
}

// A tab to run the request in: reuse a CyberVidya tab the student already has
// open if it can serve us, otherwise one of our own.
async function readyTab() {
	const existing = await chrome.tabs.query({ url: `${ERP_ORIGIN}/*` });
	const candidate = existing.find((tab) => !tab.discarded) || existing[0];
	if (candidate && (await waitForTab(candidate.id, 6000))) return candidate.id;

	const own = await openOwnWindow();
	return (await waitForTab(own, TAB_READY_TIMEOUT_MS)) ? own : null;
}

function scheduleWindowClose() {
	chrome.alarms.create(CLOSE_ALARM, { delayInMinutes: CLOSE_AFTER_MINUTES });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name !== CLOSE_ALARM) return;
	await closeHiddenDocument();
	const { bridgeWindowId } = await chrome.storage.session.get("bridgeWindowId");
	if (bridgeWindowId === undefined) return;
	await chrome.storage.session.remove("bridgeWindowId");
	try {
		await chrome.windows.remove(bridgeWindowId);
	} catch {
		// Already closed.
	}
});

async function run(request) {
	if (HAS_HIDDEN_FRAME) {
		const reply = await runInHiddenFrame(request);
		if (reply) {
			scheduleWindowClose();
			return reply;
		}
		// The hidden frame could not serve it: fall through to a tab.
	}

	const tabId = await readyTab();
	if (tabId === null) {
		return {
			status: 0,
			error:
				"Could not open a CyberVidya page. Check that kiet.cybervidya.net loads in this browser.",
		};
	}
	scheduleWindowClose();
	const reply = await chrome.tabs.sendMessage(tabId, {
		type: "erp-fetch",
		request,
	});
	return reply || { status: 0, error: "No answer from the CyberVidya page." };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (!message || message.type !== "bridge-fetch") return false;

	// Only our own content script, running on the website, may ask.
	if (sender.id !== chrome.runtime.id || !isWebsiteOrigin(sender.origin)) {
		sendResponse({ status: 0, error: "Request not allowed." });
		return false;
	}

	const request = message.request || {};
	const method = String(request.method || "GET").toUpperCase();
	if (
		typeof request.url !== "string" ||
		!request.url.startsWith(API_PREFIX) ||
		!ALLOWED_METHODS.includes(method)
	) {
		sendResponse({ status: 0, error: "Request not allowed." });
		return false;
	}

	const headers = {};
	for (const [name, value] of Object.entries(request.headers || {})) {
		if (ALLOWED_HEADERS.includes(name.toLowerCase())) {
			headers[name] = String(value);
		}
	}

	run({
		url: request.url,
		method,
		headers,
		body: method === "GET" ? undefined : request.body,
	})
		.then(sendResponse)
		.catch((error) => sendResponse({ status: 0, error: String(error) }));

	// Keep the channel open for the asynchronous response.
	return true;
});
