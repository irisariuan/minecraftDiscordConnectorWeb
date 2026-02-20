import { useEffect, useState } from "react";

const NARROW_BREAKPOINT = 768;

/**
 * Returns true when the viewport width is below NARROW_BREAKPOINT (768 px).
 * Updates reactively on resize via matchMedia.
 */
export function useIsNarrowScreen(): boolean {
	const [isNarrow, setIsNarrow] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return window.innerWidth < NARROW_BREAKPOINT;
	});

	useEffect(() => {
		const mq = window.matchMedia(
			`(max-width: ${NARROW_BREAKPOINT - 1}px)`,
		);

		// Sync immediately in case it changed between render and effect
		setIsNarrow(mq.matches);

		const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	return isNarrow;
}
