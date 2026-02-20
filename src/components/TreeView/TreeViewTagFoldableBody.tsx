import { useState, type ReactNode } from "react";
import { IoCaretDown, IoCaretUp, IoTrash } from "react-icons/io5";
import {
	bgColorRef,
	borderColorRef,
	getIcon,
} from "../../lib/treeView/component";
import {
	TreeTagContainerType,
	type TreeTag,
	type TreeTagType,
} from "../../lib/treeView/types";
import { diffBgClass, type DiffStatus } from "../../lib/treeView/diff";
import EditableDisplay from "./EditableDisplay";
import AddChildForm from "./AddChildForm";

export default function TreeViewTagFoldableBody({
	children,
	tag,
	zIndex,
	updateTag,
	noTitle,
	viewOnly,
	diffStatus,
	onDelete,
	onAddChild,
}: {
	tag: TreeTag<TreeTagType>;
	viewOnly: boolean;
	children?: ReactNode;
	zIndex: number;
	updateTag: (tag: TreeTag<TreeTagType>) => void;
	noTitle?: boolean;
	diffStatus?: DiffStatus;
	onDelete?: () => void;
	onAddChild?: (item: string | number | TreeTag<TreeTagType>) => void;
}) {
	const [showChildren, setShowChildren] = useState(true);
	const bgClass = diffStatus ? diffBgClass[diffStatus] : "";

	return (
		<div title={tag.type} className="my-1">
			<div className={`flex items-center gap-1 rounded ${bgClass}`}>
				<div className="flex items-center justify-center p-1 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-500 shrink-0">
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
					className="hover:cursor-pointer ml-auto"
					onClick={() => {
						setShowChildren((prev) => !prev);
					}}
				>
					{children &&
						(showChildren ? <IoCaretUp /> : <IoCaretDown />)}
				</button>

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

			{showChildren && (
				<div className="flex">
					<div
						className={`min-h-full rounded w-8 my-1 ${bgColorRef[zIndex] ?? ""}`}
					/>
					<div
						className={`ml-2 border-l border-b rounded-bl-xl px-2 max-w-full overflow-x-scroll ${borderColorRef[zIndex] ?? ""}`}
					>
						{children}
						{!viewOnly && onAddChild && (
							<AddChildForm
								containerType={tag.type as TreeTagContainerType}
								onAdd={onAddChild}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
