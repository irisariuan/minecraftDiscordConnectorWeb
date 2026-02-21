import { createContext, useContext } from "react";
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
 * A simple pub/sub signal that allows a deeply-nested sheet to tell all
 * ancestor sheets at depth > targetDepth to close themselves, enabling
 * multi-layer path traversal in a single action.
 */
export class OverlayCloseSignal {
	private listeners = new Set<(targetDepth: number) => void>();

	/** Register a callback. Returns an unsubscribe function. */
	subscribe(callback: (targetDepth: number) => void): () => void {
		this.listeners.add(callback);
		return () => {
			this.listeners.delete(callback);
		};
	}

	/** Close every sheet whose depth > targetDepth. */
	closeToDepth(targetDepth: number): void {
		this.listeners.forEach((cb) => cb(targetDepth));
	}
}

/** Module-level default so every tree on the page shares one signal. */
const defaultCloseSignal = new OverlayCloseSignal();

export const OverlayCloseContext =
	createContext<OverlayCloseSignal>(defaultCloseSignal);

export function useOverlayCloseSignal(): OverlayCloseSignal {
	return useContext(OverlayCloseContext);
}
