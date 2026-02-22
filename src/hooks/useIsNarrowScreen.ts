import { useEffect, useState, type RefObject } from "react";

const VIEWPORT_BREAKPOINT = 768;
const ELEMENT_BREAKPOINT = 384;

/**
 * Returns `true` when the display context is considered "narrow".
 *
 * Narrow is defined as either:
 *  - The viewport width is below 768 px, **or**
 *  - The optional `elementRef`'s rendered width is below 384 px.
 *
 * Both checks update reactively (viewport via `matchMedia`, element via
 * `ResizeObserver`). When no ref is provided the hook only checks the viewport.
 */
export function useIsNarrowScreen(
	elementRef?: RefObject<HTMLElement | null>,
): boolean {
	/* ── viewport check ─────────────────────────────────────────────── */
	const [isViewportNarrow, setIsViewportNarrow] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return window.innerWidth < VIEWPORT_BREAKPOINT;
	});

	useEffect(() => {
		const mq = window.matchMedia(
			`(max-width: ${VIEWPORT_BREAKPOINT - 1}px)`,
		);

		// Sync immediately in case it changed between render and effect
		setIsViewportNarrow(mq.matches);

		const handler = (e: MediaQueryListEvent) =>
			setIsViewportNarrow(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	/* ── element check ──────────────────────────────────────────────── */
	const [isElementNarrow, setIsElementNarrow] = useState(false);

	useEffect(() => {
		const node = elementRef?.current;
		if (!node) {
			setIsElementNarrow(false);
			return;
		}

		const ro = new ResizeObserver(([entry]) => {
			setIsElementNarrow(entry.contentRect.width < ELEMENT_BREAKPOINT);
		});
		ro.observe(node);

		return () => ro.disconnect();
	}, [elementRef]);

	return isViewportNarrow || isElementNarrow;
}
