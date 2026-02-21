import type { DiffStatus } from "../../lib/treeView/diff";
import {
	TreeTagContainerType,
	TreeTagValueType,
	type TreeTag,
	type TreeTagType,
} from "../../lib/treeView/types";
import { getRelativeTagType } from "../../lib/treeView/utils";
import Display from "./Display";
import TreeViewTagBody from "./TreeViewTagBody";

export default function StringTag({
	tag,
	updateTag,
	viewOnly,
	value,
	itemIndex,
	diffAnnotations,
	onDelete,
}: {
	tag: TreeTag<TreeTagContainerType>;
	updateTag: (tag: TreeTag<TreeTagType>) => void;
	viewOnly: boolean;
	value: string;
	itemIndex: number;
	diffAnnotations?: Map<TreeTag<TreeTagType>, DiffStatus>;
	onDelete?: () => void;
}) {
	const diffStatus = diffAnnotations?.get(tag);

	return (
		<TreeViewTagBody
			tag={{
				type: getRelativeTagType(tag.type) ?? TreeTagValueType.String,
				value,
				name: tag.name,
			}}
			onSuccess={(inp) => {
				const newValue = [...tag.value];
				newValue[itemIndex] = inp;
				const updatedTag = {
					...tag,
					value: newValue,
				};
				updateTag(updatedTag);
				return inp;
			}}
			noTitle
			viewOnly={viewOnly}
			diffStatus={diffStatus}
			onDelete={onDelete}
		>
			<Display
				className="text-sm text-neutral-600 dark:text-neutral-400"
				defaultValue={value}
				validate={(inp) => inp.match(/^[\d]+$/) !== null}
				disabled={viewOnly}
				onSuccess={(s) => {
					const newValue = [...tag.value];
					newValue[itemIndex] = s;
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
}
