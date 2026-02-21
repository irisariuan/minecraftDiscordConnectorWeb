import { type ReactNode } from "react";
import { IoTrash } from "react-icons/io5";
import {
	TreeTagValueType,
	type TreeTag,
	type TreeTagType,
} from "../../lib/treeView/types";
import { diffBgClass, type DiffStatus } from "../../lib/treeView/diff";
import { getIcon } from "../../lib/treeView/component";
import Display from "./Display";

export default function TreeViewTagBody({
	children,
	tag,
	noTitle,
	viewOnly,
	diffStatus,
	onDelete,
	onSuccess = (input) => input,
}: {
	tag: TreeTag<TreeTagType>;
	viewOnly: boolean;
	children?: ReactNode;
	noTitle?: boolean;
	diffStatus?: DiffStatus;
	onDelete?: () => unknown;
	onSuccess?: (input: string) => string;
}) {
	const bgClass = diffStatus ? diffBgClass[diffStatus] : "rounded";

	return (
		<div
			className={`flex gap-1 my-2 ${noTitle ? "items-center" : "items-start"} ${bgClass}`}
			title={tag.type}
		>
			<div className="flex items-center justify-center p-1 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-500 h-full shrink-0">
				{getIcon(tag.type)}
			</div>
			<div className="flex flex-col justify-center flex-1 min-w-0">
				{tag.type !== TreeTagValueType.CompoundEnd && !noTitle && (
					<Display
						onSuccess={onSuccess}
						validate={() => true}
						defaultValue={tag.name}
						className="text-neutral-800 dark:text-neutral-100"
						disabled={viewOnly}
					/>
				)}
				{children}
			</div>
			{!viewOnly && onDelete && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className="shrink-0 p-1 text-neutral-400 hover:text-red-50 dark:hover:text-red-400 dark:hover:bg-red-900 hover:bg-red-400 hover:cursor-pointer rounded transition-colors"
					title="Delete tag"
				>
					<IoTrash className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
