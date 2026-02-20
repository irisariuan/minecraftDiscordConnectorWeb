import { type ReactNode } from "react";
import {
	TreeTagValueType,
	type TreeTag,
	type TreeTagType,
} from "../../lib/treeView/types";
import { diffBgClass, type DiffStatus } from "../../lib/treeView/diff";
import { getIcon } from "../../lib/treeView/component";
import EditableDisplay from "./EditableDisplay";

export default function TreeViewTagBody({
	children,
	tag,
	noTitle,
	viewOnly,
	diffStatus,
	onSuccess = (input) => input,
}: {
	tag: TreeTag<TreeTagType>;
	viewOnly: boolean;
	children?: ReactNode;
	noTitle?: boolean;
	diffStatus?: DiffStatus;
	onSuccess?: (input: string) => string;
}) {
	const bgClass = diffStatus ? diffBgClass[diffStatus] : "rounded";

	return (
		<div
			className={`flex gap-1 my-1 ${noTitle ? "items-center" : "items-start"} ${bgClass}`}
			title={tag.type}
		>
			<div className="flex items-center justify-center p-1 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-500 h-full">
				{getIcon(tag.type)}
			</div>
			<div className="flex flex-col justify-center">
				{tag.type !== TreeTagValueType.CompoundEnd && !noTitle && (
					<EditableDisplay
						onSuccess={onSuccess}
						validate={() => true}
						defaultValue={tag.name}
						className="text-neutral-800 dark:text-neutral-100"
						disabled={viewOnly}
					/>
				)}
				{children}
			</div>
		</div>
	);
}
