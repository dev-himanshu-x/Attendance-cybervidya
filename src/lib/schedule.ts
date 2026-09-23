export function formatShortTime(timeString: string): string {
	if (!timeString) return "";
	const timePart = timeString.split(" ")[1] || "";
	const [h, m] = timePart.split(":");
	if (!h || !m) return "";
	const hour = Number.parseInt(h, 10);
	const ampm = hour >= 12 ? "PM" : "AM";
	const formattedHour = hour % 12 || 12;
	return `${formattedHour}:${m} ${ampm}`;
}

export function toLectureDateString(date: Date): string {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${day}/${month}/${date.getFullYear()}`;
}
