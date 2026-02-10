import { TbQuestionMark } from "react-icons/tb";
import {
	TreeTagContainerType,
	type TreeTagType,
	type TreeTag,
	TreeTagValueType,
} from "./TreeViewBody";
import TreeViewTagFoldableBody from "./TreeViewTagFoldableBody";
import TreeViewTagBody from "./TreeViewTagBody";
import EditableDisplay from "./EditableDisplay";
function expandable(
	tag: TreeTag<TreeTagType>,
): tag is TreeTag<TreeTagContainerType> {
	return (Object.values(TreeTagContainerType) as TreeTagType[]).includes(
		tag.type,
	);
}
function getRelativeTagType(tagType: TreeTagContainerType): TreeTagType | null {
	switch (tagType) {
		case TreeTagContainerType.ByteArray:
			return TreeTagValueType.Byte;
		case TreeTagContainerType.List:
			return null;
		case TreeTagContainerType.Compound:
			return null;
		case TreeTagContainerType.IntArray:
			return TreeTagValueType.Int;
		case TreeTagContainerType.LongIntArray:
			return TreeTagValueType.LongInt;
		default:
			return null;
	}
}
function isValue(tag: TreeTag<TreeTagType>): tag is TreeTag<TreeTagValueType> {
	return (Object.values(TreeTagValueType) as TreeTagType[]).includes(
		tag.type,
	);
}

export default function TreeViewTag({
	tag,
	updateTag,
	zIndex,
	noTitle,
}: {
	tag: TreeTag<TreeTagType>;
	updateTag: (tag: TreeTag<TreeTagType>) => void;
	zIndex: number;
	noTitle?: boolean;
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
			>
				{tag.value.map((v, i) => {
					if (typeof v === "string")
						return (
							<TreeViewTagBody
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
							>
								<EditableDisplay
									className="text-sm text-neutral-600 dark:text-neutral-400"
									defaultValue={v}
									validate={(inp) =>
										inp.match(/^[\d]+$/) !== null
									}
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
								/>
							</TreeViewTagBody>
						);
					return (
						<TreeViewTag
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
					onSuccess={(input) => {
						const updatedTag = { ...tag, name: input };
						updateTag(updatedTag);
						return input;
					}}
					noTitle={noTitle}
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
						/>
					</div>
				</TreeViewTagBody>
			);
		case TreeTagValueType.String:
			return (
				<TreeViewTagBody
					tag={tag}
					onSuccess={(inp) => {
						const updatedTag = { ...tag, name: inp };
						updateTag(updatedTag);
						return inp;
					}}
					noTitle={noTitle}
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
					onSuccess={(inp) => {
						const updatedTag = { ...tag, name: inp };
						updateTag(updatedTag);
						return inp;
					}}
					noTitle={noTitle}
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
									: data.match(/^[+-]?\d+$/) !== null
							}
							onSuccess={(s) => {
								const updatedTag = { ...tag, value: Number(s) };
								updateTag(updatedTag);
								return s;
							}}
						/>
					</div>
				</TreeViewTagBody>
			);
		case TreeTagValueType.CompoundEnd:
			return <TreeViewTagBody tag={tag} />;
		default:
			return <TbQuestionMark />;
	}
}
