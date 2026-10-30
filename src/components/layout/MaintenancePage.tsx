import { Wrench } from "lucide-react";

function MaintenancePage() {
	return (
		<div className="flex flex-col my-12 items-center justify-center p-6">
			<div
				className="auth-card w-full fade-in text-center"
				style={{ maxWidth: "28rem" }}
			>
				<div className="auth-card__body">
					<div className="auth-logo text-center mb-6">
						Cyber<span className="auth-logo__accent">Vidya</span>
					</div>
					<div
						className="mx-auto mb-4 flex items-center justify-center"
						style={{
							width: "3.5rem",
							height: "3.5rem",
							borderRadius: "var(--clay-radius-pill)",
							background: "var(--clay-tinted-bg)",
						}}
					>
						<Wrench className="h-6 w-6 text-[var(--clay-tinted-text)]" />
					</div>
					<h1 className="text-xl font-bold text-brutal mb-1">
						Under maintenance
					</h1>
					<p className="text-sm text-[var(--clay-muted)] mb-0">
						CyberVidya is blocking requests from this app right now, so
						attendance data can't load. We're working on a fix and expect to be
						back up on Monday.
					</p>
				</div>
			</div>
		</div>
	);
}

export default MaintenancePage;
