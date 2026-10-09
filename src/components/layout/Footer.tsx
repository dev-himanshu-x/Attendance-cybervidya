interface FooterProps {
	onShowTerms: () => void;
}

const GITHUB_URL = "https://github.com/dev-himanshu-x";
const LINKEDIN_URL = "https://www.linkedin.com/in/dev-himanshu-jaiswal";

function Footer({ onShowTerms }: FooterProps) {
	return (
		<footer className="w-full py-4 px-4 text-center text-sm text-[var(--clay-muted)]">
			© {new Date().getFullYear()} Himanshu Jaiswal
			<span className="mx-2">·</span>
			<a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
				GitHub
			</a>
			<span className="mx-2">·</span>
			<a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
				LinkedIn
			</a>
			<span className="mx-2">·</span>
			<button
				type="button"
				onClick={onShowTerms}
				className="text-[var(--link-color)] hover:underline"
			>
				Terms
			</button>
		</footer>
	);
}

export default Footer;
