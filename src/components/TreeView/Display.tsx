import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Walk up the DOM tree and find the nearest ancestor that establishes a
 * containing block for `position: fixed` elements. This happens when an
 * ancestor has a CSS `transform`, `filter`, `backdrop-filter`, `perspective`,
 * `will-change` that mentions transform/filter, or `contain: paint`.
 *
 * Motion (framer-motion / motion) typically leaves `transform: scaleY(1)` on
 * animated elements after their entrance animation completes. Even though it
 * is the identity transform, it still creates a new containing block, which
 * shifts the coordinate origin for any `position: fixed` descendant away from
 * the viewport to the transformed ancestor's top-left corner.
 *
 * When a transformed ancestor is found, returns its viewport-space offset
 * (via `getBoundingClientRect()`).
 *
 * When **no** such ancestor exists, `position: fixed` is relative to the
 * Initial Containing Block (layout viewport). On iOS Safari the virtual
 * keyboard can scroll the visual viewport within the layout viewport, causing
 * `getBoundingClientRect()` (visual-viewport coords) and `position: fixed`
 * (layout-viewport coords) to diverge. We compensate by returning the
 * negated `visualViewport` offset so the caller's subtraction
 * (`rect - offset`) converts visual-viewport coords → layout-viewport coords.
 */
function getFixedAncestorOffset(element: HTMLElement): {
	x: number;
	y: number;
} {
	let el = element.parentElement;
	while (el && el !== document.documentElement) {
		const cs = window.getComputedStyle(el);
		const isContainingBlock =
			(cs.transform && cs.transform !== "none") ||
			(cs.filter && cs.filter !== "none") ||
			(cs.backdropFilter && cs.backdropFilter !== "none") ||
			(cs.perspective && cs.perspective !== "none") ||
			(cs.willChange &&
				/transform|filter|perspective/.test(cs.willChange)) ||
			(cs.contain && /paint|layout|strict|content/.test(cs.contain));

		if (isContainingBlock) {
			const rect = el.getBoundingClientRect();
			return { x: rect.left, y: rect.top };
		}
		el = el.parentElement;
	}
	// No transformed ancestor → position:fixed is relative to the layout
	// viewport (ICB).  getBoundingClientRect() returns visual-viewport
	// coords.  On iOS Safari these diverge when the virtual keyboard is
	// open because the visual viewport scrolls within the layout viewport.
	// Return the negated offset so the caller's  `rect.top - offset.y`
	// produces layout-viewport coordinates.
	const vv = window.visualViewport;
	return {
		x: -(vv?.offsetLeft ?? 0),
		y: -(vv?.offsetTop ?? 0),
	};
}

export default function Display({
	defaultValue,
	validate,
	className,
	onSuccess,
	overrideClassName,
	disabled,
	placeholderText = "Nil",
	onDoubleClick,
}: {
	defaultValue?: string;
	validate?: (input: string) => boolean;
	onSuccess?: (input: string) => string;
	className?: string;
	overrideClassName?: boolean;
	disabled?: boolean;
	placeholderText?: string;
	/*
	 * Activate on mobile, disabled only
	 */
	onDoubleClick?: () => void;
}) {
	const ref = useRef<HTMLInputElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const [text, setText] = useState(defaultValue);
	const [isExpanded, setIsExpanded] = useState(false);
	const [expandedWidth, setExpandedWidth] = useState<number | undefined>();
	// Viewport-space rect of the wrapper, captured at expand time and kept
	// up-to-date on scroll / resize so the fixed overlay tracks the row.
	const [fixedRect, setFixedRect] = useState<DOMRect | undefined>();
	// Offset of the nearest transformed ancestor so we can compensate for
	// the shifted coordinate origin of position:fixed.
	const [ancestorOffset, setAncestorOffset] = useState({ x: 0, y: 0 });

	const isFocused = useRef(false);
	const isHovered = useRef(false);

	// ── Measurement ───────────────────────────────────────────────────────

	/** Measure the natural (unconstrained) pixel width of a string using the
	 *  same computed font styles as the input element. */
	const measureNaturalWidth = useCallback(
		(value: string): number | undefined => {
			if (!ref.current) return undefined;
			const cs = window.getComputedStyle(ref.current);
			const span = document.createElement("span");
			span.style.cssText = [
				"position:fixed",
				"top:-9999px",
				"left:-9999px",
				"visibility:hidden",
				"pointer-events:none",
				"white-space:pre",
				`font:${cs.font}`,
				`letter-spacing:${cs.letterSpacing}`,
				`word-spacing:${cs.wordSpacing}`,
				`padding-left:${cs.paddingLeft}`,
				`padding-right:${cs.paddingRight}`,
			].join(";");
			span.textContent = value;
			document.body.appendChild(span);
			const width = Math.ceil(span.getBoundingClientRect().width);
			document.body.removeChild(span);
			return width;
		},
		[],
	);

	/** Snapshot the wrapper's viewport rect AND the ancestor offset. */
	const capturePosition = useCallback(() => {
		if (!wrapperRef.current) return;
		setFixedRect(wrapperRef.current.getBoundingClientRect());
		setAncestorOffset(getFixedAncestorOffset(wrapperRef.current));
	}, []);

	// ── Expand / collapse ─────────────────────────────────────────────────

	const tryExpand = useCallback(
		(forceFocus = false) => {
			if (!ref.current || !wrapperRef.current) return;
			const value = ref.current.value || placeholderText;
			const naturalWidth = measureNaturalWidth(value);
			const rect = wrapperRef.current.getBoundingClientRect();

			const wouldOverflow =
				naturalWidth !== undefined && naturalWidth > rect.width;
			// On hover only expand when text truly overflows.
			// On focus always expand so the user has room to type.
			if (!wouldOverflow && !forceFocus) return;

			setFixedRect(rect);
			setAncestorOffset(getFixedAncestorOffset(wrapperRef.current));
			setExpandedWidth(
				wouldOverflow && naturalWidth !== undefined
					? naturalWidth + 6
					: undefined,
			);
			setIsExpanded(true);
		},
		[measureNaturalWidth, placeholderText],
	);

	const collapse = useCallback(() => {
		if (!isFocused.current && !isHovered.current) {
			setIsExpanded(false);
			setExpandedWidth(undefined);
			setFixedRect(undefined);
		}
	}, []);

	/** Re-measure while the user is typing so the overlay width tracks. */
	const handleInput = useCallback(() => {
		if (!isExpanded || !ref.current || !wrapperRef.current) return;
		const value = ref.current.value || placeholderText;
		const naturalWidth = measureNaturalWidth(value);
		const containerWidth = wrapperRef.current.clientWidth;
		if (naturalWidth !== undefined && naturalWidth > containerWidth) {
			setExpandedWidth(naturalWidth + EDGE_MARGIN);
		} else {
			setExpandedWidth(undefined);
		}
	}, [isExpanded, measureNaturalWidth, placeholderText]);

	// ── Keep position in sync while expanded ──────────────────────────────

	useEffect(() => {
		if (!isExpanded) return;
		const update = () => capturePosition();
		// `capture: true` catches scroll events from any nested scroll container
		window.addEventListener("scroll", update, {
			passive: true,
			capture: true,
		});
		window.addEventListener("resize", update, { passive: true });

		// On iOS Safari the virtual keyboard triggers viewport changes that
		// don't fire as regular window scroll/resize events.  The
		// VisualViewport API exposes dedicated resize & scroll events for
		// exactly this case.
		const vv = window.visualViewport;
		if (vv) {
			vv.addEventListener("resize", update, { passive: true });
			vv.addEventListener("scroll", update, { passive: true });
		}

		return () => {
			window.removeEventListener("scroll", update, { capture: true });
			window.removeEventListener("resize", update);
			if (vv) {
				vv.removeEventListener("resize", update);
				vv.removeEventListener("scroll", update);
			}
		};
	}, [isExpanded, capturePosition]);

	// ── Styles ────────────────────────────────────────────────────────────

	// Cap width so the input never extends past the right edge of the
	// screen.  fixedRect.left is in visual-viewport coords, so compare
	// against the visual viewport width (falling back to window.innerWidth).
	const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
	const EDGE_MARGIN = 8; // px gap before the screen edge
	const maxWidth = Math.max(
		fixedRect?.width ?? 0,
		viewportWidth - (fixedRect?.left ?? 0) - EDGE_MARGIN,
	);

	const expandedInputStyle: React.CSSProperties = fixedRect
		? {
				position: "fixed",
				// Subtract the ancestor offset so the overlay lands in the
				// correct viewport position even when position:fixed is
				// relative to a transformed ancestor rather than the viewport.
				top: fixedRect.top - ancestorOffset.y,
				left: fixedRect.left - ancestorOffset.x,
				height: fixedRect.height,
				minWidth: fixedRect.width,
				maxWidth,
				boxSizing: "border-box",
				zIndex: 10,
				...(expandedWidth && expandedWidth > fixedRect.width
					? { width: Math.min(expandedWidth, maxWidth) }
					: {}),
			}
		: {};

	const expandedInputClass =
		"bg-white dark:bg-neutral-950 " +
		"shadow dark:shadow-neutral-800 shadow-neutral-500 " +
		"rounded-sm px-1";

	const collapsedInputClass = "w-full truncate ";

	const clickTimeout = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		return () => {
			if (clickTimeout.current) clearTimeout(clickTimeout.current);
		};
	}, []);
	function doubleClickHandler() {
		if (!disabled) return
		if (clickTimeout.current) {
			clearTimeout(clickTimeout.current);
			clickTimeout.current = null;
			onDoubleClick?.();
		} else {
			clickTimeout.current = setTimeout(() => {
				clickTimeout.current = null;
			}, 300);
		}
	}

	// ── Render ────────────────────────────────────────────────────────────

	return (
		<div
			ref={wrapperRef}
			className={`relative w-full ${className ?? ""}`}
			// Reserve the row height when the input goes position:fixed.
			style={
				isExpanded && fixedRect
					? { minHeight: fixedRect.height }
					: undefined
			}
			// ── hover (on wrapper so it works even when input is disabled) ─
			onMouseEnter={() => {
				isHovered.current = true;
				tryExpand(false);
			}}
			onMouseLeave={() => {
				isHovered.current = false;
				collapse();
			}}
			onTouchStart={() => {
				tryExpand(false);
			}}
			onTouchEnd={doubleClickHandler}
		>
			<input
				ref={ref}
				defaultValue={defaultValue}
				type="text"
				className={
					overrideClassName
						? className
						: `outline-0 placeholder:text-red-500 dark:placeholder:text-red-400 placeholder:italic ` +
							(isExpanded
								? expandedInputClass
								: collapsedInputClass)
				}
				style={isExpanded ? expandedInputStyle : undefined}
				placeholder={placeholderText}
				disabled={disabled}
				// ── focus / edit ───────────────────────────────────────
				onFocus={() => {
					isFocused.current = true;
					tryExpand(true);
					// On iOS Safari the virtual keyboard opens after
					// focus, scrolling the page.  Re-capture position once
					// the keyboard animation has likely settled so the
					// fixed overlay tracks the wrapper's new location.
					requestAnimationFrame(() => {
						capturePosition();
						// A second pass catches slower keyboard animations.
						setTimeout(() => capturePosition(), 300);
					});
				}}
				onInput={handleInput}
				onBlur={(inp) => {
					isFocused.current = false;
					setIsExpanded(false);
					setExpandedWidth(undefined);
					setFixedRect(undefined);
					if (inp.currentTarget.value === text) return;
					if (!validate?.(inp.currentTarget.value)) {
						inp.preventDefault();
						if (!text) return;
						inp.currentTarget.value = text;
						return;
					}
					setText(onSuccess?.(inp.currentTarget.value));
				}}
			/>
		</div>
	);
}
