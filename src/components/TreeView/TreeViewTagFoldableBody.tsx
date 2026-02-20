import { useState, type ReactNode } from "react";
import { IoCaretDown, IoCaretUp, IoTrash, IoClose } from "react-icons/io5";
import {
	bgColorRef,
	borderColorRef,
	getIcon,
	textColorRef,
} from "../../lib/treeView/component";
import {
	TreeTagContainerType,
	type TreeTag,
	type TreeTagType,
} from "../../lib/treeView/types";
import { diffBgClass, type DiffStatus } from "../../lib/treeView/diff";
import { useIsNarrowScreen } from "../../hooks/useIsNarrowScreen";
import { OverlayDepthContext, useOverlayDepth } from "./OverlayContext";
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
	const isNarrow = useIsNarrowScreen();
	const overlayDepth = useOverlayDepth();

	// Start collapsed on narrow screens so no sheets auto-open on load.
	// On wide screens or inside an already-open sheet start expanded (inline).
	const [showChildren, setShowChildren] = useState<boolean>(() => !isNarrow);

	const bgClass = diffStatus ? diffBgClass[diffStatus] : "";

	// Each nested overlay sits above the previous one.
	// Depth 0 → backdrop z=40  sheet z=41
	// Depth 1 → backdrop z=50  sheet z=51  … etc.
	const backdropZ = 40 + overlayDepth * 10;
	const sheetZ = backdropZ + 1;

	const useOverlay = isNarrow && showChildren;

	const addForm =
		!viewOnly && onAddChild ? (
			<AddChildForm
				containerType={tag.type as TreeTagContainerType}
				onAdd={onAddChild}
			/>
		) : null;

	return (
		<div title={tag.type} className="my-1">
			{/* ── Header row ────────────────────────────────────────────────── */}
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
					onClick={() => setShowChildren((prev) => !prev)}
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

			{/* ── Inline children (wide screens) ────────────────────────────── */}
			{showChildren && !useOverlay && (
				<div className="flex">
					<div
						className={`min-h-full rounded w-8 my-1 ${bgColorRef[zIndex] ?? ""}`}
					/>
					<div
						className={`ml-2 border-l border-b rounded-bl-xl px-2 max-w-full overflow-x-scroll ${borderColorRef[zIndex] ?? ""}`}
					>
						{children}
						{addForm}
					</div>
				</div>
			)}

			{/* ── Bottom-sheet overlay (narrow screens, stacked drill-down) ─── */}
			{useOverlay && (
				<>
					{/* Backdrop — clicking closes this sheet */}
					<div
						className="fixed inset-0 bg-black/50 backdrop-blur-sm"
						style={{ zIndex: backdropZ }}
						onClick={() => setShowChildren(false)}
					/>

					{/* Sheet — sits above its own backdrop */}
					<div
						className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-2xl bg-white dark:bg-neutral-900 shadow-2xl max-h-[80vh]"
						style={{ zIndex: sheetZ }}
					>
						{/* Sheet header */}
						<div
							className={`flex items-center gap-2 px-4 py-3 border-b rounded-t-2xl dark:border-neutral-700 border-neutral-200 shrink-0 ${bgColorRef[zIndex] ?? "bg-white dark:bg-neutral-900"}`}
						>
							<div className="flex items-center justify-center p-1 dark:text-neutral-200 text-neutral-800 shrink-0">
								{getIcon(tag.type)}
							</div>
							<span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate flex-1">
								{tag.name || (
									<span className="italic text-neutral-400">
										(unnamed)
									</span>
								)}
							</span>
							<span
								className={`text-sm ${textColorRef[zIndex] ?? "text-neutral-400 dark:text-neutral-500"} shrink-0`}
							>
								{tag.type}
							</span>
							<button
								onClick={() => setShowChildren(false)}
								className="shrink-0 ml-2 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
								title="Close"
							>
								<IoClose className="h-5 w-5" />
							</button>
						</div>

						{/* Scrollable content.
						    Provide depth + 1 so any nested foldable body that the
						    user opens will stack its own sheet above this one. */}
						<OverlayDepthContext.Provider value={overlayDepth + 1}>
							<div className="overflow-y-auto flex-1 px-3 py-2">
								{children}
								{addForm}
							</div>
						</OverlayDepthContext.Provider>
					</div>
				</>
			)}
		</div>
	);
}
