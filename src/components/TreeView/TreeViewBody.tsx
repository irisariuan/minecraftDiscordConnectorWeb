import { type Dispatch, type SetStateAction } from "react";
import TreeViewTag from "./TreeViewTag";
import type { TreeTag, TreeTagType } from "../../lib/treeView/types";

export default function TreeViewBody({
	data,
	setData,
	viewOnly,
	isDiff,
}: {
	data: TreeTag<TreeTagType>;
	setData: Dispatch<SetStateAction<TreeTag<TreeTagType> | null>>;
	viewOnly: boolean;
	isDiff: boolean;
}) {
	return (
		<div className="flex-1 bg-white dark:bg-black text-black dark:text-white p-2 max-w-full overflow-scroll">
			<TreeViewTag
				zIndex={0}
				tag={data}
				updateTag={setData}
				noTitle
				viewOnly={viewOnly}
				isDiff={isDiff}
			/>
		</div>
	);
}
