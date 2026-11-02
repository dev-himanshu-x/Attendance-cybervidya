import { Puzzle } from "lucide-react";
import {
	isFirefoxFamily,
	useExtensionStatus,
} from "@/hooks/useExtensionStatus";
import {
	EXTENSION_DOWNLOAD_CHROME,
	EXTENSION_DOWNLOAD_FIREFOX,
} from "@/types/constants";

interface ExtensionRequiredNoticeProps {
	onShowGuide: () => void;
}

// A popup in the bottom corner, shown for as long as this browser does not
// have the extension — the site cannot load any data without it. It cannot be
// dismissed; it goes away by itself once the extension is installed.
export default function ExtensionRequiredNotice({
	onShowGuide,
}: ExtensionRequiredNoticeProps) {
	const status = useExtensionStatus();

	if (status !== "missing") return null;

	const firefox = isFirefoxFamily();
	const downloadHref = firefox
		? EXTENSION_DOWNLOAD_FIREFOX
		: EXTENSION_DOWNLOAD_CHROME;

	return (
		<section aria-label="Extension required" className="extension-notice">
			<p className="extension-notice__message">
				<Puzzle size={18} className="extension-notice__icon" aria-hidden />
				<span>
					This website won't work without the Attendance Bridge browser
					extension.
				</span>
			</p>
			<div className="extension-notice__actions">
				<button
					type="button"
					onClick={onShowGuide}
					className="extension-notice__btn"
				>
					How to install
				</button>
				<a
					href={downloadHref}
					download
					className="extension-notice__btn extension-notice__btn--primary"
					aria-label={`Download the Attendance Bridge extension for ${firefox ? "Firefox or Zen" : "Chrome, Edge or Brave"}`}
				>
					Download
				</a>
			</div>
		</section>
	);
}
