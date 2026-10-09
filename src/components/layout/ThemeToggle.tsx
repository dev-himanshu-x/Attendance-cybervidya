import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

interface ThemeToggleProps {
	floating?: boolean;
}

export default function ThemeToggle({ floating = false }: ThemeToggleProps) {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className={clsx("theme-toggle-btn", floating && "theme-toggle--floating")}
			aria-label={
				theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
			}
		>
			{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
		</button>
	);
}
