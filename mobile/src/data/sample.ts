// Shape of the data the home screen shows.

export interface DayRecord {
	label: string;
	// Classes on the timetable that day.
	scheduled: number;
	// Classes already held (equals `scheduled` for past days).
	held: number;
	attended: number;
}

export interface HomeData {
	studentName: string;
	// ISO date (YYYY-MM-DD) of "today" for the week shown.
	today: string;
	// Index into `week` of today.
	todayIndex: number;
	week: DayRecord[];
	totalPresent: number;
	totalHeld: number;
	targetPercentage: number;
	streakDays: number;
	bestStreak: number;
}
