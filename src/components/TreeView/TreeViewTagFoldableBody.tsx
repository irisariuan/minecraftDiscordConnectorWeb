import { useState, type ReactNode } from "react";
import { IoCaretDown, IoCaretUp } from "react-icons/io5";
import {
	bgColorRef,
	borderColorRef,
	getIcon,
} from "../../lib/treeView/component";
import { type TreeTag, type TreeTagType } from "../../lib/treeView/types";
import { diffBgClass, type DiffStatus } from "../../lib/treeView/diff";
import EditableDisplay from "./EditableDisplay";

export default function TreeViewTagFoldableBody({
	children,
	tag,
	zIndex,
	updateTag,
	noTitle,
	viewOnly,
	diffStatus,
}: {
	tag: TreeTag<TreeTagType>;
	viewOnly: boolean;
	children?: ReactNode;
	zIndex: number;
	updateTag: (tag: TreeTag<TreeTagType>) => void;
	noTitle?: boolean;
	diffStatus?: DiffStatus;
}) {
	const [showChildren, setShowChildren] = useState(true);
	const bgClass = diffStatus ? diffBgClass[diffStatus] : "rounded";

	return (
		<div title={tag.type} className="my-1">
			<div className={`flex items-center gap-1 ${bgClass}`}>
				<div className="flex items-center justify-center p-1 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-500">
					{getIcon(tag.type)}
				</div>
				{!noTitle && (
					<EditableDisplay
						validate={() => true}
						onSuccess={(s) => {
							updateTag({ ...tag, name: s });
							return s;
						}}
						defaultValue={tag.name}
						disabled={viewOnly}
					/>
				)}
				<button
					className="hover:cursor-pointer"
					onClick={() => {
						setShowChildren((prev) => !prev);
					}}
				>
					{children &&
						(showChildren ? <IoCaretUp /> : <IoCaretDown />)}
				</button>
			</div>
			{children && showChildren && (
				<div className="flex">
					<div
						className={`min-h-full rounded w-8 my-1 ${bgColorRef[zIndex] ?? ""}`}
					/>
					<div
						className={`ml-2 border-l border-b rounded-bl-xl px-2 py-1 max-w-full overflow-x-scroll ${borderColorRef[zIndex] ?? ""}`}
					>
						{children}
					</div>
				</div>
			)}
		</div>
	);
}
