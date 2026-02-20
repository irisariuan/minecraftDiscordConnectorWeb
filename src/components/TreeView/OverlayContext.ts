import { createContext, useContext } from "react";

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
export const OverlayDepthContext = createContext<number>(0);

export function useOverlayDepth(): number {
	return useContext(OverlayDepthContext);
}
