// Packs the browser extension into downloadable files that the website serves
// (public/downloads/), so the "Download extension" buttons always hand out the
// current version. Runs automatically before `dev` and `build`.
import {
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const source = fileURLToPath(
	new URL("../extension/attendance-bridge/", import.meta.url),
);
const output = fileURLToPath(new URL("../public/downloads/", import.meta.url));

// Every file in the folder, with paths relative to it (so manifest.json sits
// at the root of the archive). Skips the _metadata folder Chrome adds when it
// loads an unpacked extension, and hidden files.
function collect(dir, base = dir, files = {}) {
	for (const name of readdirSync(dir)) {
		if (name === "_metadata" || name.startsWith(".")) continue;
		const full = join(dir, name);
		if (statSync(full).isDirectory()) collect(full, base, files);
		else files[relative(base, full)] = readFileSync(full);
	}
	return files;
}

mkdirSync(output, { recursive: true });
const targets = [
	["chrome", "attendance-bridge-chrome.zip"],
	["firefox", "attendance-bridge-firefox.xpi"],
];
for (const [browser, file] of targets) {
	const files = collect(join(source, browser));
	writeFileSync(join(output, file), zipSync(files, { level: 9 }));
	console.log(`packed ${file} (${Object.keys(files).length} files)`);
}
