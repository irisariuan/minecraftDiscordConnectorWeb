import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { MdDragIndicator } from "react-icons/md";
import { TbQuestionMark } from "react-icons/tb";
import type { DiffStatus } from "../../lib/treeView/diff";
import {
	type TreeTag,
	TreeTagContainerType,
	type TreeTagType,
	TreeTagValueType,
} from "../../lib/treeView/types";
import {
	type NumericTypes,
	expandable,
	isContainerType,
	isValue,
	withinRange,
} from "../../lib/treeView/utils";
import Display from "./Display";
import NumberTag from "./NumberTag";
import StringTag from "./StringTag";
import TreeViewTagBody from "./TreeViewTagBody";
import TreeViewTagFoldableBody from "./TreeViewTagFoldableBody";

function isCompoundEndValue(
	v: string | number | TreeTag<TreeTagType>,
): boolean {
	return (
		typeof v !== "string" &&
		typeof v !== "number" &&
		v.type === TreeTagValueType.CompoundEnd
	);
}

function childKey(v: string | number | TreeTag<TreeTagType>, i: number) {
	if (typeof v === "string") return `s-${i}-${v}`;
	if (typeof v === "number") return `n-${i}-${v}`;
	return `t-${i}-${v.name}`;
}

/** Attribute placed on each draggable wrapper so elementFromPoint can resolve an index. */
const DRAG_INDEX_ATTR = "data-drag-index";

export default function TreeViewTag({
	tag,
	updateTag,
	zIndex,
	noTitle,
	viewOnly,
	diffAnnotations,
	onDelete,
}: {
	tag: TreeTag<TreeTagType>;
	updateTag: (tag: TreeTag<TreeTagType>) => void;
	zIndex: number;
	noTitle?: boolean;
	viewOnly: boolean;
	diffAnnotations?: Map<TreeTag<TreeTagType>, DiffStatus>;
	onDelete?: () => void;
}) {
	const diffStatus = diffAnnotations?.get(tag);

	// ── Drag state (shared by HTML5 DnD and touch) ─────────────────────────
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverPos, setDragOverPos] = useState<number | null>(null);

	// ── Touch-drag refs (mutable, avoids stale closures in global listeners)
	const touchDragRef = useRef<{
		index: number;
		startY: number;
		currentY: number;
		ghost: HTMLDivElement | null;
	} | null>(null);
	// We keep a ref-mirror of dragOverPos for the global touchmove handler
	const dragOverPosRef = useRef<number | null>(null);
	const draggedIndexRef = useRef<number | null>(null);

	// Sync refs with state
	useEffect(() => {
		dragOverPosRef.current = dragOverPos;
	}, [dragOverPos]);
	useEffect(() => {
		draggedIndexRef.current = draggedIndex;
	}, [draggedIndex]);

	// ── Child mutation helpers ──────────────────────────────────────────────

	function removeChildAt(index: number) {
		const newValue = (
			tag.value as (string | number | TreeTag<TreeTagType>)[]
		).filter((_, i) => i !== index);
		updateTag({ ...tag, value: newValue });
	}

	function addChild(item: string | number | TreeTag<TreeTagType>) {
		const newValue = [
			...(tag.value as (string | number | TreeTag<TreeTagType>)[]),
			item,
		];
		// Keep CompoundEnd at the very end
		if (isContainerType(tag)) {
			const endIdx = newValue.findIndex(
				(v) =>
					typeof v !== "string" &&
					typeof v !== "number" &&
					v.type === TreeTagValueType.CompoundEnd,
			);
			if (endIdx !== -1 && endIdx !== newValue.length - 1) {
				const temp = newValue[endIdx];
				newValue[endIdx] = newValue[newValue.length - 1];
				newValue[newValue.length - 1] = temp;
			}
		}
		// New Compound children need their own CompoundEnd sentinel
		if (
			typeof item !== "string" &&
			typeof item !== "number" &&
			item.type === TreeTagContainerType.Compound
		) {
			(item as TreeTag<TreeTagContainerType.Compound>).value.push({
				type: TreeTagValueType.CompoundEnd,
				name: "",
				value: undefined,
			});
		}
		updateTag({ ...tag, value: newValue });
	}

	// ── Reorder logic (shared) ─────────────────────────────────────────────

	/**
	 * Move item at `from` so that it ends up just before the original item
	 * that was at position `toPos` (0-based "insert before" index).
	 */
	const doReorder = useCallback(
		(from: number, toPos: number) => {
			// toPos === from   → drop on itself (top half)
			// toPos === from+1 → drop on itself (bottom half)
			if (toPos === from || toPos === from + 1) {
				setDraggedIndex(null);
				setDragOverPos(null);
				return;
			}
			const values = [
				...(tag.value as (string | number | TreeTag<TreeTagType>)[]),
			];
			const [moved] = values.splice(from, 1);
			const insertAt = from < toPos ? toPos - 1 : toPos;
			values.splice(insertAt, 0, moved);
			updateTag({ ...tag, value: values });
			setDraggedIndex(null);
			setDragOverPos(null);
		},
		[tag, updateTag],
	);

	// ── HTML5 Drag helpers ─────────────────────────────────────────────────

	function posFromEvent(e: React.DragEvent<HTMLDivElement>, index: number) {
		const rect = e.currentTarget.getBoundingClientRect();
		return e.clientY < rect.top + rect.height / 2 ? index : index + 1;
	}

	function handleDragStart(
		e: React.DragEvent<HTMLDivElement>,
		index: number,
	) {
		e.stopPropagation();
		e.dataTransfer.effectAllowed = "move";
		setDraggedIndex(index);
	}

	function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
		e.preventDefault();
		e.stopPropagation();
		setDragOverPos(posFromEvent(e, index));
	}

	function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
		if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
			setDragOverPos(null);
		}
	}

	function handleDrop(e: React.DragEvent<HTMLDivElement>, index: number) {
		e.preventDefault();
		e.stopPropagation();
		if (draggedIndex === null) return;
		const insertPos = posFromEvent(e, index);
		doReorder(draggedIndex, insertPos);
	}

	function handleDragEnd() {
		setDraggedIndex(null);
		setDragOverPos(null);
	}

	// ── Touch drag helpers ─────────────────────────────────────────────────

	/**
	 * Find the draggable wrapper element (with DRAG_INDEX_ATTR) at the given
	 * screen coordinates. Returns the parsed index or null.
	 */
	function indexFromPoint(
		clientX: number,
		clientY: number,
	): { index: number; rect: DOMRect } | null {
		// elementFromPoint may hit a child; walk up to find the wrapper
		let el = document.elementFromPoint(
			clientX,
			clientY,
		) as HTMLElement | null;
		while (el) {
			const attr = el.getAttribute(DRAG_INDEX_ATTR);
			if (attr !== null) {
				return {
					index: Number(attr),
					rect: el.getBoundingClientRect(),
				};
			}
			el = el.parentElement;
		}
		return null;
	}

	function posFromTouch(
		clientY: number,
		index: number,
		rect: DOMRect,
	): number {
		return clientY < rect.top + rect.height / 2 ? index : index + 1;
	}

	/** Create a floating ghost element that follows the finger. */
	function createGhost(
		sourceEl: HTMLElement,
		clientX: number,
		clientY: number,
	): HTMLDivElement {
		const ghost = document.createElement("div");
		ghost.style.position = "fixed";
		ghost.style.zIndex = "99999";
		ghost.style.pointerEvents = "none";
		ghost.style.opacity = "0.85";
		ghost.style.transition = "none";
		ghost.style.willChange = "transform";

		// Clone the visual appearance
		const rect = sourceEl.getBoundingClientRect();
		ghost.style.width = `${rect.width}px`;
		ghost.style.left = "0px";
		ghost.style.top = "0px";
		ghost.style.transform = `translate(${clientX - rect.width / 2}px, ${clientY - 20}px)`;

		// Shallow visual clone
		const clone = sourceEl.cloneNode(true) as HTMLElement;
		clone.style.margin = "0";
		clone.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)";
		clone.style.borderRadius = "8px";
		clone.style.background = "var(--tw-bg, #1a1a2e)";
		// Try to read computed bg for accuracy
		try {
			const computed = getComputedStyle(sourceEl);
			if (
				computed.backgroundColor &&
				computed.backgroundColor !== "rgba(0, 0, 0, 0)"
			) {
				clone.style.background = computed.backgroundColor;
			}
		} catch {
			// ignore
		}
		ghost.appendChild(clone);
		document.body.appendChild(ghost);
		return ghost;
	}

	function handleTouchStart(
		e: React.TouchEvent<HTMLDivElement>,
		index: number,
	) {
		// Only handle single-finger touches on the drag handle
		if (e.touches.length !== 1) return;
		const touch = e.touches[0];

		// Find the draggable wrapper (parent with DRAG_INDEX_ATTR)
		let wrapperEl = e.currentTarget as HTMLElement;
		while (wrapperEl && !wrapperEl.hasAttribute(DRAG_INDEX_ATTR)) {
			wrapperEl = wrapperEl.parentElement as HTMLElement;
		}

		const ghost = wrapperEl
			? createGhost(wrapperEl, touch.clientX, touch.clientY)
			: null;

		touchDragRef.current = {
			index,
			startY: touch.clientY,
			currentY: touch.clientY,
			ghost,
		};

		setDraggedIndex(index);

		// Attach global listeners
		document.addEventListener("touchmove", onGlobalTouchMove, {
			passive: false,
		});
		document.addEventListener("touchend", onGlobalTouchEnd);
		document.addEventListener("touchcancel", onGlobalTouchEnd);
	}

	// Using stable refs so we can add/remove these as document listeners
	const onGlobalTouchMove = useCallback((e: TouchEvent) => {
		const td = touchDragRef.current;
		if (!td) return;
		// Prevent scrolling while dragging
		e.preventDefault();

		const touch = e.touches[0];
		td.currentY = touch.clientY;

		// Move the ghost
		if (td.ghost) {
			const rect = td.ghost.getBoundingClientRect();
			td.ghost.style.transform = `translate(${touch.clientX - rect.width / 2}px, ${touch.clientY - 20}px)`;
		}

		// Determine which item the finger is over
		// Temporarily hide ghost so elementFromPoint can see through it
		if (td.ghost) td.ghost.style.display = "none";
		const hit = indexFromPoint(touch.clientX, touch.clientY);
		if (td.ghost) td.ghost.style.display = "";

		if (hit) {
			const pos = posFromTouch(touch.clientY, hit.index, hit.rect);
			setDragOverPos(pos);
		}
	}, []);

	const onGlobalTouchEnd = useCallback(() => {
		const td = touchDragRef.current;
		if (!td) return;

		// Remove ghost
		if (td.ghost) {
			td.ghost.remove();
			td.ghost = null;
		}

		const from = td.index;
		const toPos = dragOverPosRef.current;

		touchDragRef.current = null;

		// Clean up listeners
		document.removeEventListener("touchmove", onGlobalTouchMove);
		document.removeEventListener("touchend", onGlobalTouchEnd);
		document.removeEventListener("touchcancel", onGlobalTouchEnd);

		if (toPos !== null) {
			doReorder(from, toPos);
		} else {
			setDraggedIndex(null);
			setDragOverPos(null);
		}
	}, [doReorder, onGlobalTouchMove]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			document.removeEventListener("touchmove", onGlobalTouchMove);
			document.removeEventListener("touchend", onGlobalTouchEnd);
			document.removeEventListener("touchcancel", onGlobalTouchEnd);
			if (touchDragRef.current?.ghost) {
				touchDragRef.current.ghost.remove();
			}
		};
	}, [onGlobalTouchMove, onGlobalTouchEnd]);

	// ── Expandable (container) rendering ────────────────────────────────────

	if (expandable(tag)) {
		const values = tag.value as (string | number | TreeTag<TreeTagType>)[];

		return (
			<TreeViewTagFoldableBody
				tag={tag}
				zIndex={zIndex}
				updateTag={(newTag) => updateTag(newTag)}
				noTitle={noTitle}
				viewOnly={viewOnly}
				diffStatus={diffStatus}
				onDelete={onDelete}
				onAddChild={addChild}
			>
				{values.map((v, i) => {
					const isEnd = isCompoundEndValue(v);
					const canDrag = !viewOnly && !isEnd;
					const isDragging = draggedIndex === i;

					// Build the child element
					let child: React.ReactNode;

					if (typeof v === "string") {
						child = (
							<StringTag
								tag={tag}
								updateTag={updateTag}
								viewOnly={viewOnly}
								value={v}
								itemIndex={i}
								diffAnnotations={diffAnnotations}
								onDelete={
									!viewOnly
										? () => removeChildAt(i)
										: undefined
								}
							/>
						);
					} else if (typeof v === "number") {
						child = (
							<NumberTag
								tag={tag}
								updateTag={updateTag}
								viewOnly={viewOnly}
								value={v}
								itemIndex={i}
								diffAnnotations={diffAnnotations}
								onDelete={
									!viewOnly
										? () => removeChildAt(i)
										: undefined
								}
							/>
						);
					} else {
						child = (
							<TreeViewTag
								tag={v}
								zIndex={zIndex + 1}
								updateTag={(newTag) => {
									const next = [...values];
									next[i] = newTag;
									updateTag({ ...tag, value: next });
								}}
								noTitle={tag.type === TreeTagContainerType.List}
								viewOnly={viewOnly}
								diffAnnotations={diffAnnotations}
								onDelete={
									!viewOnly
										? () => removeChildAt(i)
										: undefined
								}
							/>
						);
					}

					// CompoundEnd: render bare, no drag wrapper
					if (isEnd) {
						return (
							<Fragment key={childKey(v, i)}>{child}</Fragment>
						);
					}

					// Drop indicator rendered as a sibling <div>
					const showIndicatorBefore =
						dragOverPos === i &&
						draggedIndex !== null &&
						draggedIndex !== i &&
						draggedIndex !== i - 1;

					const showIndicatorAfter =
						dragOverPos === i + 1 &&
						draggedIndex !== null &&
						draggedIndex !== i &&
						draggedIndex !== i + 1 &&
						// only on last draggable slot; siblings handle the rest
						i ===
							values.filter((x) => !isCompoundEndValue(x))
								.length -
								1;

					return (
						<Fragment key={childKey(v, i)}>
							{/* Insert-before indicator */}
							{showIndicatorBefore && (
								<div className="h-0.5 bg-blue-500 dark:bg-blue-400 rounded-full my-px mx-1 pointer-events-none" />
							)}

							{/* Draggable wrapper */}
							<div
								{...{ [DRAG_INDEX_ATTR]: i }}
								draggable={canDrag}
								onDragStart={
									canDrag
										? (e) => handleDragStart(e, i)
										: undefined
								}
								onDragEnd={handleDragEnd}
								onDragOver={
									canDrag
										? (e) => handleDragOver(e, i)
										: undefined
								}
								onDragLeave={
									canDrag ? handleDragLeave : undefined
								}
								onDrop={
									canDrag
										? (e) => handleDrop(e, i)
										: undefined
								}
								className={`flex items-center group/drag transition-opacity ${
									isDragging ? "opacity-30" : "opacity-100"
								}`}
							>
								{/* Drag handle — visible on hover (desktop) and always visible on touch devices */}
								{canDrag && (
									<div
										className="self-stretch shrink-0 flex items-center cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-600 opacity-100 sm:opacity-0 sm:group-hover/drag:opacity-100 transition-opacity select-none hover:bg-neutral-600 dark:hover:bg-neutral-900 rounded mr-2 touch-none"
										onTouchStart={
											canDrag
												? (e) => handleTouchStart(e, i)
												: undefined
										}
									>
										<MdDragIndicator className="h-4 w-4" />
									</div>
								)}

								{/* Child content */}
								<div className="flex-1 min-w-0">{child}</div>
							</div>

							{/* Insert-after indicator (last slot only) */}
							{showIndicatorAfter && (
								<div className="h-0.5 bg-blue-500 dark:bg-blue-400 rounded-full my-px mx-1 pointer-events-none" />
							)}
						</Fragment>
					);
				})}
			</TreeViewTagFoldableBody>
		);
	}

	// Value (leaf) rendering

	if (!isValue(tag)) {
		return <TbQuestionMark />;
	}

	switch (tag.type) {
		case TreeTagValueType.Byte:
			return (
				<TreeViewTagBody
					tag={tag}
					diffStatus={diffStatus}
					onSuccess={(input) => {
						updateTag({ ...tag, name: input });
						return input;
					}}
					noTitle={noTitle}
					viewOnly={viewOnly}
					onDelete={onDelete}
				>
					<div className="m-1">
						<Display
							className="text-sm text-neutral-600 dark:text-neutral-400"
							defaultValue={(tag.value as number)
								.toString(16)
								.toUpperCase()}
							validate={(data) =>
								data.toLowerCase().match(/^[0-9a-f]+$/) !== null
							}
							onSuccess={(s) => {
								updateTag({ ...tag, value: parseInt(s, 16) });
								return s.toUpperCase();
							}}
							disabled={viewOnly}
						/>
					</div>
				</TreeViewTagBody>
			);

		case TreeTagValueType.String:
			return (
				<TreeViewTagBody
					tag={tag}
					diffStatus={diffStatus}
					onSuccess={(inp) => {
						updateTag({ ...tag, name: inp });
						return inp;
					}}
					noTitle={noTitle}
					viewOnly={viewOnly}
					onDelete={onDelete}
				>
					<div className="m-1">
						<Display
							className="text-sm text-neutral-600 dark:text-neutral-400"
							defaultValue={tag.value?.toString()}
							validate={() => true}
							onSuccess={(s) => {
								updateTag({ ...tag, value: s });
								return s;
							}}
							disabled={viewOnly}
						/>
					</div>
				</TreeViewTagBody>
			);

		case TreeTagValueType.Int:
		case TreeTagValueType.ShortInt:
		case TreeTagValueType.LongInt:
		case TreeTagValueType.Float:
		case TreeTagValueType.DoubleFloat:
			return (
				<TreeViewTagBody
					tag={tag}
					diffStatus={diffStatus}
					onSuccess={(inp) => {
						updateTag({ ...tag, name: inp });
						return inp;
					}}
					noTitle={noTitle}
					viewOnly={viewOnly}
					onDelete={onDelete}
				>
					<div className="m-1">
						<Display
							className="text-sm text-neutral-600 dark:text-neutral-400"
							defaultValue={tag.value?.toString()}
							validate={(data) =>
								tag.type === TreeTagValueType.Float ||
								tag.type === TreeTagValueType.DoubleFloat
									? data.match(
											/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/,
										) !== null
									: data.match(/^[+-]?\d+$/) !== null ||
										withinRange(
											Number(data),
											tag.type as NumericTypes,
										)
							}
							onSuccess={(s) => {
								updateTag({ ...tag, value: Number(s) });
								return s;
							}}
							disabled={viewOnly}
						/>
					</div>
				</TreeViewTagBody>
			);

		case TreeTagValueType.CompoundEnd:
			return <TreeViewTagBody viewOnly={false} tag={tag} />;

		default:
			return <TbQuestionMark />;
	}
}
