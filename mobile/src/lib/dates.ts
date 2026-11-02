// Local-time YYYY-MM-DD, used as the key for per-day data.
export function toDateKey(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Schedule entries carry dates as "dd/mm/yyyy".
export function parseLectureDate(value: string | null): string | null {
	if (!value) return null;
	const [day, month, year] = value.split("/");
	if (!day || !month || !year) return null;
	return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

// Monday of the week containing `now`, at local midnight.
export function weekStart(now: Date): Date {
	const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const sinceMonday = (day.getDay() + 6) % 7;
	return addDays(day, -sinceMonday);
}

export function formatLongDate(iso: string): string {
	return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function formatShortDate(value: string | Date): string {
	const d = typeof value === "string" ? new Date(value) : value;
	return d.toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// "2026-10-29 10:30:00" -> "10:30 AM"
export function formatShortTime(timeString: string): string {
	if (!timeString) return "";
	const timePart = timeString.split(" ")[1] || "";
	const [h, m] = timePart.split(":");
	if (!h || !m) return "";
	const hour = Number.parseInt(h, 10);
	return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

// Date of a class from its "dd/mm/yyyy" lectureDate and "yyyy-mm-dd HH:mm:ss" start.
export function classStartTime(lectureDate: string, start: string): Date {
	const [day, month, year] = lectureDate.split("/").map(Number);
	const [hours = 0, minutes = 0] = (start.split(" ")[1] ?? "")
		.split(":")
		.map(Number);
	return new Date(year, month - 1, day, hours, minutes);
}

export function toLectureDateString(date: Date): string {
	return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}
