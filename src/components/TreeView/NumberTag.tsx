import type { DiffStatus } from "../../lib/treeView/diff";
import {
	TreeTagContainerType,
	TreeTagValueType,
	type TreeTag,
	type TreeTagType,
} from "../../lib/treeView/types";
import { getRelativeTagType } from "../../lib/treeView/utils";
import EditableDisplay from "./EditableDisplay";
import TreeViewTagBody from "./TreeViewTagBody";

export default function NumberTag({
	tag,
	updateTag,
	viewOnly,
	value,
	itemIndex,
	diffAnnotations,
	onDelete,
}: {
	tag: TreeTag<TreeTagContainerType>;
	updateTag: (tag: TreeTag<TreeTagContainerType>) => void;
	viewOnly: boolean;
	value: number;
	itemIndex: number;
	diffAnnotations?: Map<TreeTag<TreeTagType>, DiffStatus>;
	onDelete?: () => void;
}) {
	const diffStatus = diffAnnotations?.get(tag);

	return (
		<TreeViewTagBody
			tag={{
				type: getRelativeTagType(tag.type) ?? TreeTagValueType.Int,
				value,
				name: tag.name,
			}}
			onSuccess={(inp) => {
				const newValue = [...tag.value];
				newValue[itemIndex] = Number(inp);
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
			<EditableDisplay
				className="text-sm text-neutral-600 dark:text-neutral-400"
				defaultValue={value.toString()}
				validate={(inp) => {
					const num = Number(inp);
					return !isNaN(num) && Number.isInteger(num);
				}}
				onSuccess={(s) => {
					const newValue = [...tag.value];
					newValue[itemIndex] = Number(s);
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
}
