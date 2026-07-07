/**
 * Check if a navigation path matches the current location pathname.
 * Uses precise matching to avoid false positives (e.g., /test matching /testOutlet).
 *
 * @param pathname - Current location pathname (e.g., "/testOutlet/child1")
 * @param navPath - Navigation item path (e.g., "/test" or "/testOutlet")
 * @returns true if the path matches, false otherwise
 */
export function isNavPathActive(pathname: string, navPath: string): boolean {
	// Skip matching for anchor links (e.g., "#label")
	if (navPath.startsWith("#")) {
		return false;
	}

	// Exact match
	if (pathname === navPath) {
		return true;
	}

	// Prefix match for nested routes (e.g., /testOutlet matches /testOutlet/child1)
	// But ensure we don't match /test when pathname is /testOutlet/child1
	if (pathname.startsWith(`${navPath}/`)) {
		return true;
	}

	return false;
}
