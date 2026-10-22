/** Tiny class-name joiner (replaces the `cn` package used by the reference repo). */
export function cn(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(' ');
}
