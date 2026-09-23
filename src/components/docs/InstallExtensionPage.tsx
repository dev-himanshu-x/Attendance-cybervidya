import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

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

			<header className="mb-4 pb-3 border-bottom">
				<h1 className="fw-bold mb-2">Install Kiet Auth Bridge</h1>
				<p className="text-secondary">
					A secure bridge to sync your attendance from Kiet ERP.
				</p>
			</header>

			<div className="d-flex flex-column gap-4">
				<div className="alert-callout alert-callout--warning">
					<p className="small mb-0">
						<strong>Why is this required?</strong> To securely retrieve your
						authentication token without storing your password, we use a browser
						extension. This ensures your credentials stay safe on the official
						ERP site.
					</p>
				</div>

				<div className="row g-4">
					{/* Chrome / Edge / Brave */}
					<section className="col-12 col-md-6 d-flex flex-column gap-3">
						<h3 className="fw-bold fs-5 d-flex align-items-center gap-2 border-bottom pb-2">
							<span className="badge text-bg-primary">DESKTOP</span> Chrome /
							Edge / Brave
						</h3>
						<a
							href="https://github.com/AmanDevelops/attendance-kiet/releases/latest/download/chrome.zip"
							className="btn btn-primary fw-bold text-center"
						>
							Download Extension (ZIP)
						</a>
						<div className="bg-light p-3 rounded border">
							<h4 className="fw-semibold mb-2 fs-6">Installation Steps:</h4>
							<ol className="small text-secondary mb-0">
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
					<section className="col-12 col-md-6 d-flex flex-column gap-3">
						<h3 className="fw-bold fs-5 d-flex align-items-center gap-2 border-bottom pb-2">
							<span
								className="badge"
								style={{ backgroundColor: "#fed7aa", color: "#9a3412" }}
							>
								DESKTOP
							</span>{" "}
							Firefox
						</h3>
						<a
							href="https://github.com/AmanDevelops/attendance-kiet/releases/latest/download/firefox.xpi"
							className="btn fw-bold text-center text-white"
							style={{ backgroundColor: "#ea580c" }}
						>
							Download Extension (.xpi)
						</a>
						<div className="alert-callout alert-callout--warning small">
							<strong>⚠️ IMPORTANT:</strong> After installing or changing
							permissions, you <u>MUST reload this page</u> for the extension to
							be detected.
						</div>
						<div className="bg-light p-3 rounded border">
							<h4 className="fw-semibold mb-2 fs-6">Installation Steps:</h4>
							<ol className="small text-secondary mb-0">
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
				<section className="border-top pt-4">
					<h3 className="fw-bold fs-5 mb-3 d-flex align-items-center gap-2">
						<span className="badge text-bg-success">MOBILE</span> Android Users
					</h3>
					<div className="bg-light p-4 rounded border">
						<p className="text-secondary mb-3">
							Standard Chrome on Android does not support extensions. You must
							use a browser that does.
						</p>

						<div>
							<h4 className="fw-bold fs-6 mb-2" style={{ color: "#c2410c" }}>
								Firefox Nightly (Recommended)
							</h4>
							<p className="small text-secondary mb-3">
								Firefox Nightly for Android now supports installing add-ons
								directly from .xpi files!
							</p>

							<a
								href="https://github.com/AmanDevelops/attendance-kiet/releases/latest/download/firefox.xpi"
								className="btn fw-bold text-center text-white d-block mb-3"
								style={{ backgroundColor: "#ea580c" }}
							>
								Download Extension (.xpi)
							</a>

							<div className="d-flex flex-column gap-3">
								<div>
									<h5 className="fw-semibold small mb-2">
										Step 1: Access the Debug Menu
									</h5>
									<ul className="small text-secondary mb-0">
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
									<h5 className="fw-semibold small mb-2">
										Step 2: Install Your Add-ons
									</h5>
									<ul className="small text-secondary mb-0">
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

								<div className="pt-2 border-top">
									<a
										href="https://www.reddit.com/r/firefox/s/ATGHJktQN"
										target="_blank"
										rel="noreferrer"
										className="small link-primary"
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
