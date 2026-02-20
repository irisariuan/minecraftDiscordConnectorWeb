import { Fragment, useState } from "react";
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
import EditableDisplay from "./EditableDisplay";
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

	// Drag state (used only in the expandable branch)
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverPos, setDragOverPos] = useState<number | null>(null);

	// Child mutation helpers

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

	// Drag helpers

	/**
	 * Compute "insert-before" position (0…n) from the cursor position relative
	 * to the midpoint of the hovered element.
	 */
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
		// Only clear when the cursor truly leaves this item (not entering a child)
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

	/**
	 * Move item at `from` so that it ends up just before the original item
	 * that was at position `toPos` (0-based "insert before" index).
	 */
	function doReorder(from: number, toPos: number) {
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
		// After removal, indices above `from` shift down by 1
		const insertAt = from < toPos ? toPos - 1 : toPos;
		values.splice(insertAt, 0, moved);
		updateTag({ ...tag, value: values });
		setDraggedIndex(null);
		setDragOverPos(null);
	}

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
								{/* Drag handle */}
								{canDrag && (
									<div className="self-stretch shrink-0 flex items-center cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-600 opacity-0 group-hover/drag:opacity-100 transition-opacity select-none hover:bg-neutral-600 dark:hover:bg-neutral-900 rounded mr-2">
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
						<EditableDisplay
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
						<EditableDisplay
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
						<EditableDisplay
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
