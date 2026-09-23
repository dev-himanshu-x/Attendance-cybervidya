import { LogOut, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

const NAV_SECTIONS = [
	{ id: "attendance", label: "Attendance" },
	{ id: "courses", label: "Courses" },
];

interface AppHeaderProps {
	searchQuery?: string;
	onSearchChange?: (value: string) => void;
	onLogout?: () => void;
}

function scrollToSection(id: string) {
	document
		.getElementById(id)
		?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function AppHeader({
	searchQuery,
	onSearchChange,
	onLogout,
}: AppHeaderProps) {
	const isAuthenticated = !!onLogout;
	const [isScrolled, setIsScrolled] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 8);
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		if (!isAuthenticated) setIsSidebarOpen(false);
	}, [isAuthenticated]);

	useEffect(() => {
		if (!isSidebarOpen) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isSidebarOpen]);

	const closeSidebar = () => setIsSidebarOpen(false);

	const handleNavClick = (id: string) => {
		scrollToSection(id);
		closeSidebar();
	};

	const handleLogoutClick = () => {
		closeSidebar();
		onLogout?.();
	};

	return (
		<header
			className={`app-header ${isScrolled ? "app-header--scrolled" : ""}`}
		>
			<div className="app-header__brand">
				<span className="app-header__name">
					<span className="app-header__name-accent">Cyber</span>Vidya
				</span>
			</div>

			{isAuthenticated && (
				<>
					<nav className="app-header__nav">
						{NAV_SECTIONS.map((section) => (
							<button
								key={section.id}
								type="button"
								className="app-header__nav-item"
								onClick={() => scrollToSection(section.id)}
							>
								{section.label}
							</button>
						))}
					</nav>

					<div className="app-header__actions">
						<div className="app-header__search">
							<Search size={16} className="app-header__search-icon" />
							<input
								type="search"
								placeholder="Search courses..."
								value={searchQuery}
								onChange={(e) => onSearchChange?.(e.target.value)}
								aria-label="Search courses"
							/>
						</div>
						<button
							type="button"
							className="app-header__cta"
							onClick={onLogout}
						>
							<LogOut size={16} />
							<span className="btn-brutal__text">Logout</span>
						</button>
					</div>

					<button
						type="button"
						className="app-header__menu-toggle"
						onClick={() => setIsSidebarOpen(true)}
						aria-label="Open menu"
						aria-expanded={isSidebarOpen}
					>
						<Menu size={20} />
					</button>

					<div
						className={`app-sidebar ${isSidebarOpen ? "app-sidebar--open" : ""}`}
					>
						<button
							type="button"
							className="app-sidebar__backdrop"
							onClick={closeSidebar}
							aria-label="Close menu"
							tabIndex={isSidebarOpen ? 0 : -1}
						/>
						<div className="app-sidebar__panel">
							<div className="app-sidebar__header">
								<div className="app-sidebar__search">
									<Search size={16} className="app-header__search-icon" />
									<input
										type="search"
										placeholder="Search courses..."
										value={searchQuery}
										onChange={(e) => onSearchChange?.(e.target.value)}
										aria-label="Search courses"
									/>
								</div>
								<button
									type="button"
									className="app-sidebar__close"
									onClick={closeSidebar}
									aria-label="Close menu"
								>
									<X size={20} />
								</button>
							</div>

							<nav className="app-sidebar__nav">
								{NAV_SECTIONS.map((section) => (
									<button
										key={section.id}
										type="button"
										className="app-sidebar__nav-item"
										onClick={() => handleNavClick(section.id)}
									>
										{section.label}
									</button>
								))}
							</nav>

							<button
								type="button"
								className="app-header__cta app-sidebar__cta"
								onClick={handleLogoutClick}
							>
								<LogOut size={16} />
								<span className="btn-brutal__text">Logout</span>
							</button>
						</div>
					</div>
				</>
			)}
		</header>
	);
}
