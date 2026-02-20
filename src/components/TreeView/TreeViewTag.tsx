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
		// swap the new item with the last element (CompoundEnd) to keep CompoundEnd at the end of the list
		if (isContainerType(tag)) {
			const compoundEndIndex = newValue.findIndex(
				(v) =>
					typeof v !== "string" &&
					typeof v !== "number" &&
					v.type === TreeTagValueType.CompoundEnd,
			);
			if (compoundEndIndex !== -1) {
				const temp = newValue[compoundEndIndex];
				newValue[compoundEndIndex] = newValue[newValue.length - 1];
				newValue[newValue.length - 1] = temp;
			}
		}
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

	if (expandable(tag)) {
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
				{(tag.value as (string | number | TreeTag<TreeTagType>)[]).map(
					(v, i) => {
						if (typeof v === "string") {
							return (
								<StringTag
									key={v + i.toString()}
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
						}
						if (typeof v === "number") {
							return (
								<NumberTag
									key={v.toString() + i.toString()}
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
						}
						return (
							<TreeViewTag
								key={v.name + i.toString()}
								tag={v}
								zIndex={zIndex + 1}
								updateTag={(newTag) => {
									const newValue = [
										...(tag.value as (
											| string
											| number
											| TreeTag<TreeTagType>
										)[]),
									];
									newValue[i] = newTag;
									updateTag({ ...tag, value: newValue });
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
					},
				)}
			</TreeViewTagFoldableBody>
		);
	}

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
