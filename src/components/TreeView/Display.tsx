import { AnimatePresence } from "motion/react";
import { useRef, useState, useCallback, useEffect } from "react";
import { IoCopy, IoCut, IoTrash } from "react-icons/io5";
import ToolBarButton from "./ToolBarButton";

export default function Display({
	defaultValue,
	validate,
	className,
	onSuccess,
	overrideClassName,
	disabled,
	placeholderText = "Nil",
	onDoubleClick,
	toolbarElement,
	enableToolbar = true,
}: {
	defaultValue?: string;
	validate?: (input: string) => boolean;
	onSuccess?: (input: string) => string;
	className?: string;
	overrideClassName?: boolean;
	disabled?: boolean;
	placeholderText?: string;
	enableToolbar?: boolean;
	toolbarElement?: React.ReactNode;
	/*
	 * Activate on mobile, disabled only
	 */
	onDoubleClick?: () => void;
}) {
	const ref = useRef<HTMLInputElement | HTMLSpanElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const [text, setText] = useState(defaultValue);
	const [isExpanded, setIsExpanded] = useState(false);
	const [showToolbar, setShowToolbar] = useState(false);
	const [expandedWidth, setExpandedWidth] = useState<number | undefined>();
	// Viewport-space rect of the wrapper, captured at expand time and kept
	// up-to-date on scroll / resize so the fixed overlay tracks the row.
	const [fixedRect, setFixedRect] = useState<DOMRect | undefined>();

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
	}, []);

	// ── Expand / collapse ─────────────────────────────────────────────────

	/** Get the text content from either an input or a span. */
	const getRefText = useCallback((): string => {
		if (!ref.current) return "";
		if (ref.current instanceof HTMLInputElement) return ref.current.value;
		return ref.current.textContent ?? "";
	}, []);

	const tryExpand = useCallback(
		(forceFocus = false) => {
			if (!ref.current || !wrapperRef.current) return;
			const value = getRefText() || placeholderText;
			const naturalWidth = measureNaturalWidth(value);
			const rect = wrapperRef.current.getBoundingClientRect();

			const wouldOverflow =
				naturalWidth !== undefined && naturalWidth > rect.width;
			// On hover only expand when text truly overflows.
			// On focus always expand so the user has room to type.
			if (!wouldOverflow && !forceFocus) return;

			setFixedRect(rect);
			setExpandedWidth(
				wouldOverflow && naturalWidth !== undefined
					? naturalWidth + 6
					: undefined,
			);
			setIsExpanded(true);
		},
		[measureNaturalWidth, placeholderText, getRefText],
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
		const value = getRefText() || placeholderText;
		const naturalWidth = measureNaturalWidth(value);
		const containerWidth = wrapperRef.current.clientWidth;
		if (naturalWidth !== undefined && naturalWidth > containerWidth) {
			setExpandedWidth(naturalWidth + EDGE_MARGIN);
		} else {
			setExpandedWidth(undefined);
		}
	}, [isExpanded, measureNaturalWidth, placeholderText, getRefText]);

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
		"absolute top-0 " +
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
	const handleClickOutside = useCallback(
		(event: MouseEvent | TouchEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				setShowToolbar(false);
			}
		},
		[wrapperRef.current, setShowToolbar],
	);
	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("touchstart", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		};
	}, []);

	// ── Render ────────────────────────────────────────────────────────────

	return (
		<div
			ref={wrapperRef}
			className={`relative w-full group ${className ?? ""}`}
			// Reserve the row height when the input goes position:fixed.
			style={
				isExpanded && fixedRect
					? { minHeight: fixedRect.height }
					: undefined
			}
			// ── hover (on wrapper so it works even when input is disabled) ─
			onMouseEnter={() => {
				isHovered.current = true;
				setShowToolbar(true);
				tryExpand(false);
			}}
			onMouseLeave={() => {
				isHovered.current = false;
				setShowToolbar(false);
				collapse();
			}}
			onTouchStart={() => {
				tryExpand(false);
			}}
			onClick={() => {
				setShowToolbar(true);
				doubleClickHandler();
			}}
		>
			{disabled ? (
				<span
					ref={ref as React.Ref<HTMLSpanElement>}
					className={
						overrideClassName
							? className
							: `outline-0 block ` +
								(isExpanded
									? expandedInputClass +
										" overflow-x-scroll text-nowrap"
									: collapsedInputClass) +
								(!defaultValue
									? " text-red-500 dark:text-red-400 italic"
									: "")
					}
					style={isExpanded ? expandedInputStyle : undefined}
				>
					{defaultValue || placeholderText}
				</span>
			) : (
				<input
					ref={ref as React.Ref<HTMLInputElement>}
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
					// ── focus / edit ───────────────────────────────────────
					onFocus={() => {
						isFocused.current = true;
						tryExpand(true);
						setShowToolbar(true);
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
			)}
			{enableToolbar && (
				<AnimatePresence>
					{(showToolbar || isExpanded) && (
						<div className="absolute box-border py-2 mt-4 rounded z-10 flex flex-wrap justify-center gap-2 items-center top-0">
							{toolbarElement}
							<ToolBarButton
								onClick={() => {
									try {
										navigator.clipboard
											.writeText(getRefText())
											.catch(() => {});
									} catch (e) {
										console.error(
											"Clipboard API not supported",
											e,
										);
									}
								}}
							>
								<IoCopy />
							</ToolBarButton>
							{!disabled && (
								<>
									<ToolBarButton
										onClick={() => {
											if (
												!ref.current ||
												!(
													ref.current instanceof
													HTMLInputElement
												)
											)
												return;
											try {
												navigator.clipboard
													.writeText(getRefText())
													.catch(() => {});
											} catch (e) {
												console.error(
													"Clipboard API not supported",
													e,
												);
											}
											ref.current.value = "";
											setText("");
											ref.current.focus();
											handleInput();
										}}
									>
										<IoCut />
									</ToolBarButton>

									<ToolBarButton
										onClick={() => {
											if (
												!ref.current ||
												!(
													ref.current instanceof
													HTMLInputElement
												)
											)
												return;
											ref.current.value = "";
											setText("");
											ref.current.focus();
											handleInput();
										}}
									>
										<IoTrash />
									</ToolBarButton>
								</>
							)}
						</div>
					)}
				</AnimatePresence>
			)}
		</div>
	);
}
