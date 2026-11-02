import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import {
	EXTENSION_DOWNLOAD_CHROME,
	EXTENSION_DOWNLOAD_FIREFOX,
} from "../../types/constants";
import Badge from "../ui/Badge";

const SOURCE_URL = "https://github.com/dev-himanshu-x/Attendance-cybervidya";

interface InstallExtensionPageProps {
	onBack: () => void;
}

interface BrowserCard {
	id: string;
	badge: { label: string; variant: "tinted" | "highlight" | "present" };
	title: string;
	intro?: string;
	action: { label: string; href: string; download?: boolean };
	steps: ReactNode[];
	note?: ReactNode;
}

const BROWSERS: BrowserCard[] = [
	{
		id: "chrome",
		badge: { label: "Desktop", variant: "tinted" },
		title: "Chrome / Edge / Brave",
		action: {
			label: "Download (.zip)",
			href: EXTENSION_DOWNLOAD_CHROME,
			download: true,
		},
		steps: [
			<>Download the file and unzip it.</>,
			<>
				Open <code>chrome://extensions</code> (Brave:{" "}
				<code>brave://extensions</code>, Edge: <code>edge://extensions</code>).
			</>,
			<>
				Turn on <strong>Developer mode</strong> (top right).
			</>,
			<>
				Click <strong>Load unpacked</strong> and choose the unzipped folder.
			</>,
		],
	},
	{
		id: "firefox",
		badge: { label: "Desktop", variant: "tinted" },
		title: "Firefox / Zen",
		action: {
			label: "Download (.xpi)",
			href: EXTENSION_DOWNLOAD_FIREFOX,
			download: true,
		},
		steps: [
			<>Download the .xpi file.</>,
			<>
				Open <code>about:debugging#/runtime/this-firefox</code>.
			</>,
			<>
				Click <strong>Load Temporary Add-on…</strong> and choose the file you
				downloaded.
			</>,
		],
		note: (
			<>
				A temporary add-on is removed when the browser restarts, so repeat these
				steps after a restart. A permanent install needs a signed add-on.
			</>
		),
	},
	{
		id: "safari",
		badge: { label: "Mac", variant: "highlight" },
		title: "Safari",
		intro: "Safari extensions are built on a Mac with Xcode.",
		action: { label: "Get the source", href: SOURCE_URL },
		steps: [
			<>
				Open <code>extension/safari/Attendance Bridge</code> in Xcode and press{" "}
				<strong>Run</strong>.
			</>,
			<>
				In Safari: <strong>Settings → Advanced</strong>, tick{" "}
				<strong>Show features for web developers</strong>, then{" "}
				<strong>Develop → Allow Unsigned Extensions</strong>.
			</>,
			<>
				Under <strong>Settings → Extensions</strong>, switch on{" "}
				<strong>Attendance Bridge</strong> and allow it on{" "}
				<code>kiet.cybervidya.net</code> and this site.
			</>,
		],
	},
	{
		id: "android",
		badge: { label: "Android", variant: "present" },
		title: "Firefox Nightly",
		intro: "Standard Chrome on Android can't use extensions.",
		action: {
			label: "Download (.xpi)",
			href: EXTENSION_DOWNLOAD_FIREFOX,
			download: true,
		},
		steps: [
			<>
				In Firefox Nightly open{" "}
				<strong>Settings → About Firefox Nightly</strong> and tap the logo{" "}
				<strong>five times</strong> to unlock Secret Settings.
			</>,
			<>
				Back in <strong>Settings</strong>, choose{" "}
				<strong>Install add-on from file</strong>.
			</>,
			<>Pick the .xpi file you downloaded.</>,
		],
		note: (
			<a
				href="https://www.reddit.com/r/firefox/s/ATGHJktQN"
				target="_blank"
				rel="noreferrer"
			>
				Learn more about this feature →
			</a>
		),
	},
];

const FLOW = [
	{ title: "Download", text: "Pick your browser below." },
	{ title: "Install", text: "Add it to the browser." },
	{ title: "Reload", text: "Reload this page after installing." },
];

const InstallExtensionPage = ({ onBack }: InstallExtensionPageProps) => {
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "instant" });
	}, []);

	return (
		<article className="docs-page install-page">
			<header className="install-header">
				<button type="button" className="docs-page__back" onClick={onBack}>
					<ArrowLeft size={18} />
					Back
				</button>
				<div>
					<h1 className="install-title">Install Attendance Bridge</h1>
					<p className="install-subtitle">
						A small browser extension this site needs to read your attendance.
					</p>
				</div>
			</header>

			<div className="install-why">
				<strong>Why is it required?</strong> CyberVidya only accepts requests
				made from its own pages. The extension makes them for you, inside your
				own browser. Nothing goes through our servers, and your password goes
				only to CyberVidya.
			</div>

			<ol className="install-flow">
				{FLOW.map((item, i) => (
					<li key={item.title} className="install-flow__item">
						<span className="install-flow__number">{i + 1}</span>
						<div>
							<p className="install-flow__title">{item.title}</p>
							<p className="install-flow__text">{item.text}</p>
						</div>
					</li>
				))}
			</ol>

			<div className="install-grid">
				{BROWSERS.map((browser) => (
					<section key={browser.id} className="install-card">
						<div className="install-card__head">
							<Badge variant={browser.badge.variant} size="sm">
								{browser.badge.label}
							</Badge>
							<h2 className="install-card__title">{browser.title}</h2>
						</div>

						{browser.intro && (
							<p className="install-card__intro">{browser.intro}</p>
						)}

						<a
							href={browser.action.href}
							download={browser.action.download}
							target={browser.action.download ? undefined : "_blank"}
							rel={browser.action.download ? undefined : "noopener noreferrer"}
							className="btn-brutal btn-brutal--primary install-card__action"
						>
							{browser.action.download ? (
								<Download size={16} />
							) : (
								<ExternalLink size={16} />
							)}
							{browser.action.label}
						</a>

						<ol className="install-steps">
							{browser.steps.map((step, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: fixed, ordered steps
								<li key={i}>
									<span>{step}</span>
								</li>
							))}
						</ol>

						{browser.note && <div className="install-note">{browser.note}</div>}
					</section>
				))}
			</div>
		</article>
	);
};

export default InstallExtensionPage;
