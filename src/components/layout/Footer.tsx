import { Github, Linkedin } from "lucide-react";

function Footer() {
	return (
		<footer className="app-footer">
			<p className="app-footer__credit text-[var(--clay-muted)] mb-0">
				Made with ❤️ by Himanshu Jaiswal
			</p>
			<div className="app-footer__links">
				<a
					href="https://github.com/dev-himanshu-x"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="GitHub"
					className="text-[var(--clay-muted)]"
				>
					<Github size={26} />
				</a>
				<a
					href="https://www.linkedin.com/in/dev-himanshu-jaiswal"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="LinkedIn"
					className="text-[var(--clay-muted)]"
				>
					<Linkedin size={26} />
				</a>
			</div>
		</footer>
	);
}

export default Footer;
