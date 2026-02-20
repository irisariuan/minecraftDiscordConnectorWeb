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
 * Returns the viewport-space offset of that ancestor (via
 * `getBoundingClientRect()`). When no such ancestor exists the offset is
 * (0, 0) and `position: fixed` behaves normally (relative to the viewport).
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
	return { x: 0, y: 0 };
}

export default function EditableDisplay({
	defaultValue,
	validate,
	className,
	onSuccess,
	overrideClassName,
	disabled,
	placeholderText = "Nil",
}: {
	defaultValue?: string;
	validate: (input: string) => boolean;
	onSuccess: (input: string) => string;
	className?: string;
	overrideClassName?: boolean;
	disabled?: boolean;
	placeholderText?: string;
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
			setExpandedWidth(naturalWidth + 6);
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
		return () => {
			window.removeEventListener("scroll", update, { capture: true });
			window.removeEventListener("resize", update);
		};
	}, [isExpanded, capturePosition]);

	// ── Styles ────────────────────────────────────────────────────────────

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
				boxSizing: "border-box",
				zIndex: 99999,
				...(expandedWidth && expandedWidth > fixedRect.width
					? { width: expandedWidth }
					: {}),
			}
		: {};

	const expandedInputClass =
		"bg-white dark:bg-black " +
		"shadow-[0_2px_8px_rgba(0,0,0,0.18)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5)] " +
		"ring-1 ring-inset ring-neutral-300 dark:ring-neutral-600 " +
		"rounded-sm px-1";

	const collapsedInputClass = "w-full truncate ";

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
		>
			<label />
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
				// ── hover ──────────────────────────────────────────────
				onMouseEnter={() => {
					isHovered.current = true;
					tryExpand(false);
				}}
				onMouseLeave={() => {
					isHovered.current = false;
					collapse();
				}}
				// ── focus / edit ───────────────────────────────────────
				onFocus={() => {
					isFocused.current = true;
					tryExpand(true);
				}}
				onInput={handleInput}
				onBlur={(inp) => {
					isFocused.current = false;
					setIsExpanded(false);
					setExpandedWidth(undefined);
					setFixedRect(undefined);
					if (inp.currentTarget.value === text) return;
					if (!validate(inp.currentTarget.value)) {
						inp.preventDefault();
						if (!text) return;
						inp.currentTarget.value = text;
						return;
					}
					setText(onSuccess(inp.currentTarget.value));
				}}
			/>
		</div>
	);
}
