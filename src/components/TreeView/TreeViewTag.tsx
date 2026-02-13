import { TbQuestionMark } from "react-icons/tb";
import {
	TreeTagContainerType,
	type TreeTagType,
	type TreeTag,
	TreeTagValueType,
} from "../../lib/treeView/types";
import {
	expandable,
	isValue,
	getRelativeTagType,
	withinRange,
	type NumericTypes,
} from "../../lib/treeView/utils";
import TreeViewTagFoldableBody from "./TreeViewTagFoldableBody";
import TreeViewTagBody from "./TreeViewTagBody";
import EditableDisplay from "./EditableDisplay";

export default function TreeViewTag({
	tag,
	updateTag,
	zIndex,
	noTitle,
	viewOnly,
	isDiff,
}: {
	tag: TreeTag<TreeTagType>;
	updateTag: (tag: TreeTag<TreeTagType>) => void;
	zIndex: number;
	noTitle?: boolean;
	viewOnly: boolean;
	isDiff: boolean;
}) {
	if (expandable(tag)) {
		return (
			<TreeViewTagFoldableBody
				tag={tag}
				zIndex={zIndex}
				updateTag={(newTag) => {
					updateTag(newTag);
				}}
				noTitle={noTitle}
				viewOnly={viewOnly}
				isDiff={isDiff}
			>
				{tag.value.map((v, i) => {
					if (typeof v === "string")
						return (
							<TreeViewTagBody
								isDiff={isDiff}
								tag={{
									type:
										getRelativeTagType(tag.type) ??
										TreeTagValueType.String,
									value: v,
									name: tag.name,
								}}
								onSuccess={(inp) => {
									const newValue = [...tag.value];
									newValue[i] = inp;
									const updatedTag = {
										...tag,
										value: newValue,
									};
									updateTag(updatedTag);
									return inp;
								}}
								noTitle
								viewOnly={viewOnly}
							>
								<EditableDisplay
									className="text-sm text-neutral-600 dark:text-neutral-400"
									defaultValue={v}
									validate={(inp) =>
										inp.match(/^[\d]+$/) !== null
									}
									disabled={viewOnly}
									onSuccess={(s) => {
										const newValue = [...tag.value];
										newValue[i] = s;
										const updatedTag = {
											...tag,
											value: newValue,
										};
										updateTag(updatedTag);
										return s;
									}}
								/>
							</TreeViewTagBody>
						);
					if (typeof v === "number")
						return (
							<TreeViewTagBody
								tag={{
									type:
										getRelativeTagType(tag.type) ??
										TreeTagValueType.Int,
									value: v,
									name: tag.name,
								}}
								onSuccess={(inp) => {
									const newValue = [...tag.value];
									newValue[i] = Number(inp);
									const updatedTag = {
										...tag,
										value: newValue,
									};
									updateTag(updatedTag);
									return inp;
								}}
								noTitle
								viewOnly={viewOnly}
								isDiff={isDiff}
							>
								<EditableDisplay
									className="text-sm text-neutral-600 dark:text-neutral-400"
									defaultValue={v.toString()}
									validate={(inp) => {
										const num = Number(inp);
										return (
											!isNaN(num) && Number.isInteger(num)
										);
									}}
									onSuccess={(s) => {
										const newValue = [...tag.value];
										newValue[i] = Number(s);
										const updatedTag = {
											...tag,
											value: newValue,
										};
										updateTag(updatedTag);
										return s;
									}}
									disabled={viewOnly}
								/>
							</TreeViewTagBody>
						);
					return (
						<TreeViewTag
							isDiff={isDiff}
							tag={v}
							key={v.name + v.value + i.toString()}
							zIndex={zIndex + 1}
							updateTag={(newTag) => {
								const newValue = [...tag.value];
								newValue[i] = newTag;
								const updatedTag = { ...tag, value: newValue };
								updateTag(updatedTag);
							}}
							noTitle={tag.type === TreeTagContainerType.List}
							viewOnly={viewOnly}
						/>
					);
				})}
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
					isDiff={isDiff}
					onSuccess={(input) => {
						const updatedTag = { ...tag, name: input };
						updateTag(updatedTag);
						return input;
					}}
					noTitle={noTitle}
					viewOnly={viewOnly}
				>
					<div className="m-1">
						<EditableDisplay
							className="text-sm text-neutral-600 dark:text-neutral-400"
							defaultValue={(tag.value as number)
								.toString(16)
								.toUpperCase()}
							validate={(data) => {
								return (
									data.toLowerCase().match(/^[0-9a-f]+$/) !==
									null
								);
							}}
							onSuccess={(s) => {
								const updatedTag = {
									...tag,
									value: parseInt(s, 16),
								};
								updateTag(updatedTag);
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
					isDiff={isDiff}
					tag={tag}
					onSuccess={(inp) => {
						const updatedTag = { ...tag, name: inp };
						updateTag(updatedTag);
						return inp;
					}}
					noTitle={noTitle}
					viewOnly={viewOnly}
				>
					<div className="m-1">
						<EditableDisplay
							className="text-sm text-neutral-600 dark:text-neutral-400"
							defaultValue={tag.value?.toString()}
							validate={() => true}
							onSuccess={(s) => {
								const updatedTag = { ...tag, value: s };
								updateTag(updatedTag);
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
					isDiff={isDiff}
					tag={tag}
					onSuccess={(inp) => {
						const updatedTag = { ...tag, name: inp };
						updateTag(updatedTag);
						return inp;
					}}
					noTitle={noTitle}
					viewOnly={viewOnly}
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
								const updatedTag = { ...tag, value: Number(s) };
								updateTag(updatedTag);
								return s;
							}}
							disabled={viewOnly}
						/>
					</div>
				</TreeViewTagBody>
			);
		case TreeTagValueType.CompoundEnd:
			return (
				<TreeViewTagBody viewOnly={false} isDiff={false} tag={tag} />
			);
		default:
			return <TbQuestionMark />;
	}
}
