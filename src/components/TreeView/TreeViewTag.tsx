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
import type { Dispatch, SetStateAction } from "react";
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
}: {
	tag: TreeTag<TreeTagType>;
	updateTag: Dispatch<SetStateAction<TreeTag<TreeTagType>>>;
	zIndex: number;
}) {
	if (expandable(tag)) {
		return (
			<TreeViewTagFoldableBody
				tag={tag}
				zIndex={zIndex}
				updateTag={(newTag) => {
					updateTag(newTag);
					return newTag;
				}}
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
									tag.value[i] = inp;
									updateTag(tag);
									return inp;
								}}
								noTitle
							>
								<EditableDisplay
									className="text-sm text-neutral-400"
									defaultValue={v}
									validate={(inp) =>
										inp.match(/^[\d]+$/) !== null
									}
									onSuccess={(s) => {
										tag.value[i] = s;
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
									tag.value[i] = Number(inp);
									updateTag(tag);
									return inp;
								}}
								noTitle
							>
								<EditableDisplay
									className="text-sm text-neutral-400"
									defaultValue={v.toString()}
									validate={(inp) => {
										const num = Number(inp);
										return (
											!isNaN(num) && Number.isInteger(num)
										);
									}}
									onSuccess={(s) => {
										tag.value[i] = Number(s);
										updateTag(tag);
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
								tag.value[i] = newTag.name;
								updateTag(tag);
								return newTag;
							}}
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
						tag.name = input;
						updateTag(tag);
						return input;
					}}
				>
					<div className="m-1">
						<EditableDisplay
							className="text-sm text-neutral-400"
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
								tag.value = parseInt(s, 16);
								updateTag(tag);
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
						tag.name = inp;
						updateTag(tag);
						return inp;
					}}
				>
					<div className="m-1">
						<EditableDisplay
							className="text-sm text-neutral-400"
							defaultValue={tag.value?.toString()}
							validate={() => true}
							onSuccess={(s) => {
								tag.value = s;
								updateTag(tag);
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
						tag.name = inp;
						updateTag(tag);
						return inp;
					}}
				>
					<div className="m-1">
						<EditableDisplay
							className="text-sm text-neutral-400"
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
								tag.value = Number(s);
								updateTag(tag);
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
