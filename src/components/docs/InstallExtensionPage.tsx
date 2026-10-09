import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import Badge from "../ui/Badge";

interface InstallExtensionPageProps {
	onBack: () => void;
}

const InstallExtensionPage = ({ onBack }: InstallExtensionPageProps) => {
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "instant" });
	}, []);

	return (
		<article className="docs-page">
			<button type="button" className="docs-page__back" onClick={onBack}>
				<ArrowLeft size={18} />
				Back
			</button>

			<header className="mb-6 pb-4 border-b border-[rgba(163,177,198,0.25)]">
				<h1 className="font-bold mb-2">Install Kiet Auth Bridge</h1>
				<p className="text-[var(--clay-muted)]">
					A secure bridge to sync your attendance from Kiet ERP.
				</p>
			</header>

			<div className="flex flex-col gap-6">
				<div className="alert-callout alert-callout--warning">
					<p className="text-sm mb-0">
						<strong>Why is this required?</strong> To securely retrieve your
						authentication token without storing your password, we use a browser
						extension. This ensures your credentials stay safe on the official
						ERP site.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Chrome / Edge / Brave */}
					<section className="flex flex-col gap-4">
						<h3 className="font-bold text-xl flex items-center gap-2 border-b border-[rgba(163,177,198,0.25)] pb-2">
							<Badge variant="tinted" size="sm">
								DESKTOP
							</Badge>{" "}
							Chrome / Edge / Brave
						</h3>
						<a
							href="https://github.com/AmanDevelops/attendance-kiet/releases/latest/download/chrome.zip"
							className="btn-brutal btn-brutal--primary text-center"
						>
							Download Extension (ZIP)
						</a>
						<div className="bg-[var(--clay-surface)] p-4 rounded-[0.9rem] border border-[rgba(163,177,198,0.25)]">
							<h4 className="font-semibold mb-2 text-base">
								Installation Steps:
							</h4>
							<ol className="text-sm text-[var(--clay-muted)] mb-0">
								<li>Download and extract the ZIP file.</li>
								<li>
									Open <code>chrome://extensions</code> in your browser.
								</li>
								<li>
									Enable <strong>Developer mode</strong> (toggle in top right).
								</li>
								<li>
									Click <strong>Load unpacked</strong> button.
								</li>
								<li>Select the extracted folder.</li>
							</ol>
						</div>
					</section>

					{/* Firefox */}
					<section className="flex flex-col gap-4">
						<h3 className="font-bold text-xl flex items-center gap-2 border-b border-[rgba(163,177,198,0.25)] pb-2">
							<span
								className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full"
								style={{ backgroundColor: "#fed7aa", color: "#9a3412" }}
							>
								DESKTOP
							</span>{" "}
							Firefox
						</h3>
						<a
							href="https://github.com/AmanDevelops/attendance-kiet/releases/latest/download/firefox.xpi"
							className="btn-brutal text-center text-white w-full"
							style={{ backgroundColor: "#ea580c" }}
						>
							Download Extension (.xpi)
						</a>
						<div className="alert-callout alert-callout--warning text-sm">
							<strong>⚠️ IMPORTANT:</strong> After installing or changing
							permissions, you <u>MUST reload this page</u> for the extension to
							be detected.
						</div>
						<div className="bg-[var(--clay-surface)] p-4 rounded-[0.9rem] border border-[rgba(163,177,198,0.25)]">
							<h4 className="font-semibold mb-2 text-base">
								Installation Steps:
							</h4>
							<ol className="text-sm text-[var(--clay-muted)] mb-0">
								<li>Download and extract the ZIP file.</li>
								<li>
									Open <code>about:addons</code> in Firefox.
								</li>
								<li>
									Click <strong>Settings</strong> icon on top.
								</li>
								<li>
									Click <strong>Install Add-on From File…</strong>
								</li>
								<li>
									Select the <code>firefox.xpi</code> file you just downloaded
								</li>
								<li>
									Click on <code>Add</code>
								</li>
								<li>Enable Extension that you just added</li>
							</ol>
						</div>
					</section>
				</div>

				{/* Android */}
				<section className="border-t border-[rgba(163,177,198,0.25)] pt-6">
					<h3 className="font-bold text-xl mb-4 flex items-center gap-2">
						<Badge variant="present" size="sm">
							MOBILE
						</Badge>{" "}
						Android Users
					</h3>
					<div className="bg-[var(--clay-surface)] p-6 rounded-[0.9rem] border border-[rgba(163,177,198,0.25)]">
						<p className="text-[var(--clay-muted)] mb-4">
							Standard Chrome on Android does not support extensions. You must
							use a browser that does.
						</p>

						<div>
							<h4
								className="font-bold text-base mb-2"
								style={{ color: "#c2410c" }}
							>
								Firefox Nightly (Recommended)
							</h4>
							<p className="text-sm text-[var(--clay-muted)] mb-4">
								Firefox Nightly for Android now supports installing add-ons
								directly from .xpi files!
							</p>

							<a
								href="https://github.com/AmanDevelops/attendance-kiet/releases/latest/download/firefox.xpi"
								className="btn-brutal text-center text-white block mb-4"
								style={{ backgroundColor: "#ea580c" }}
							>
								Download Extension (.xpi)
							</a>

							<div className="flex flex-col gap-4">
								<div>
									<h5 className="font-semibold text-sm mb-2">
										Step 1: Access the Debug Menu
									</h5>
									<ul className="text-sm text-[var(--clay-muted)] mb-0">
										<li>
											Open Firefox Nightly and navigate to{" "}
											<strong>Settings</strong>.
										</li>
										<li>
											Scroll to <strong>About Firefox Nightly</strong>.
										</li>
										<li>
											Tap the Firefox logo swiftly <strong>five times</strong>.
										</li>
										<li>
											This will unlock the <strong>Secret Settings</strong> in
											your main Settings menu.
										</li>
									</ul>
								</div>

								<div>
									<h5 className="font-semibold text-sm mb-2">
										Step 2: Install Your Add-ons
									</h5>
									<ul className="text-sm text-[var(--clay-muted)] mb-0">
										<li>
											Go back to the main <strong>Settings</strong> menu.
										</li>
										<li>
											You'll see a new option:{" "}
											<strong>Install add-on from file</strong>.
										</li>
										<li>Select the .xpi file you've saved on your device.</li>
										<li>Your add-on will be installed!</li>
									</ul>
								</div>

								<div className="pt-2 border-t border-[rgba(163,177,198,0.25)]">
									<a
										href="https://www.reddit.com/r/firefox/s/ATGHJktQN"
										target="_blank"
										rel="noreferrer"
										className="text-sm"
									>
										Learn more about this feature →
									</a>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</article>
	);
};

export default InstallExtensionPage;
