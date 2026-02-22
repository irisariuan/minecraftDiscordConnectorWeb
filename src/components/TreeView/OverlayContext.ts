import { createContext, useContext, type RefObject } from "react";
import type { TreeTag, TreeTagType } from "../../lib/treeView/types";

/**
 * Tracks how many overlay sheets are currently open in the ancestor chain.
 * 0  = not inside any overlay (root tree view)
 * 1  = inside the first sheet
 * 2  = inside a sheet opened from within another sheet
 * …and so on.
 *
 * Foldable bodies use this to:
 *  - compute the correct z-index for their backdrop + sheet so they stack properly
 *  - decide whether to show a sheet at all (always yes on narrow screens, any depth)
 */
export const OverlayDepthContext = createContext<TreeTag<TreeTagType>[]>([]);

export function useOverlayPath(): TreeTag<TreeTagType>[] {
	return useContext(OverlayDepthContext);
}

/**
 * Unified overlay signal that combines close-to-depth broadcasting with
 * active-depth tracking. Every open sheet registers/unregisters itself so
 * ancestors can detect children above them (for zoom-out animations), and
 * any sheet can broadcast a close-to-depth event so deeply-nested sheets
 * can collapse in a single action.
 */
export class OverlaySignal {
	/* ── close-to-depth ─────────────────────────────────────────────── */
	private closeListeners = new Set<(targetDepth: number) => void>();

	/** Register a close callback. Returns an unsubscribe function. */
	subscribeClose(callback: (targetDepth: number) => void): () => void {
		this.closeListeners.add(callback);
		return () => {
			this.closeListeners.delete(callback);
		};
	}

	/** Close every sheet whose depth > targetDepth. */
	closeToDepth(targetDepth: number): void {
		this.closeListeners.forEach((cb) => cb(targetDepth));
	}

	/* ── active-depth tracking ──────────────────────────────────────── */
	private depthCounts = new Map<number, number>();
	private activeListeners = new Set<() => void>();

	/** Register an active sheet at the given depth. */
	register(depth: number): void {
		this.depthCounts.set(depth, (this.depthCounts.get(depth) || 0) + 1);
		this.notifyActive();
	}

	/** Unregister an active sheet at the given depth. */
	unregister(depth: number): void {
		const count = (this.depthCounts.get(depth) || 1) - 1;
		if (count <= 0) this.depthCounts.delete(depth);
		else this.depthCounts.set(depth, count);
		this.notifyActive();
	}

	/** Subscribe to active-depth changes. Returns an unsubscribe function. */
	subscribeActive(callback: () => void): () => void {
		this.activeListeners.add(callback);
		return () => {
			this.activeListeners.delete(callback);
		};
	}

	/** Check whether any sheet at a depth strictly above `depth` is active. */
	hasDepthAbove(depth: number): boolean {
		for (const d of this.depthCounts.keys()) {
			if (d > depth) return true;
		}
		return false;
	}

	/** Return the maximum currently-active depth, or -1 if none. */
	maxDepth(): number {
		let max = -1;
		for (const d of this.depthCounts.keys()) {
			if (d > max) max = d;
		}
		return max;
	}

	/**
	 * How many active overlay levels sit above `depth`.
	 * 0 means this is the topmost sheet (or no children are open).
	 */
	levelsAbove(depth: number): number {
		const max = this.maxDepth();
		if (max <= depth) return 0;
		return max - depth;
	}

	private notifyActive(): void {
		this.activeListeners.forEach((cb) => cb());
	}
}

/** Module-level default so every tree on the page shares one signal. */
const defaultSignal = new OverlaySignal();

export const OverlaySignalContext = createContext<OverlaySignal>(defaultSignal);

export function useOverlaySignal(): OverlaySignal {
	return useContext(OverlaySignalContext);
}

/**
 * Provides a portal container element that lives inside the React/Astro island.
 * Sheets portal into this container instead of `document.body` so they escape
 * ancestor CSS transforms (which break position:fixed) without leaving the island.
 */
export const OverlayPortalContext =
	createContext<RefObject<HTMLDivElement | null> | null>(null);

export function useOverlayPortal(): HTMLDivElement | null {
	const ref = useContext(OverlayPortalContext);
	return ref?.current ?? null;
}
