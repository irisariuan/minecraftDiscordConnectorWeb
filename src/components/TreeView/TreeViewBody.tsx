import { type Dispatch, type SetStateAction } from "react";
import TreeViewTag from "./TreeViewTag";
import type { TreeTag, TreeTagType } from "../../lib/treeView/types";
import type { DiffStatus } from "../../lib/treeView/diff";

export default function TreeViewBody({
	data,
	setData,
	viewOnly,
	diffAnnotations,
}: {
	data: TreeTag<TreeTagType>;
	setData: Dispatch<SetStateAction<TreeTag<TreeTagType> | null>>;
	viewOnly: boolean;
	diffAnnotations?: Map<TreeTag<TreeTagType>, DiffStatus>;
}) {
	return (
		<div className="flex-1 bg-white dark:bg-black text-black dark:text-white p-2 max-w-full">
			<TreeViewTag
				zIndex={0}
				tag={data}
				updateTag={setData}
				viewOnly={viewOnly}
				diffAnnotations={diffAnnotations}
			/>
		</div>
	);
}
