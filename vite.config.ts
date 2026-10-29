import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [tailwindcss(), react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		// Mirrors what api/[...path].ts does in production, so `bun run dev`
		// works without needing `vercel dev` to serve the serverless function.
		proxy: {
			"/api": {
				target: "https://kiet.cybervidya.net",
				changeOrigin: true,
			},
		},
	},
});
