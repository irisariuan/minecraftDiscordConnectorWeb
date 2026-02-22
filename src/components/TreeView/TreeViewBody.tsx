import { useRef, type Dispatch, type SetStateAction } from "react";
import TreeViewTag from "./TreeViewTag";
import type { TreeTag, TreeTagType } from "../../lib/treeView/types";
import type { DiffStatus } from "../../lib/treeView/diff";
import { OverlayPortalContext } from "./OverlayContext";

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
	const portalRef = useRef<HTMLDivElement | null>(null);

	return (
		<OverlayPortalContext value={portalRef}>
			<div className="relative flex-1 bg-white dark:bg-black text-black dark:text-white p-2 max-w-full">
				<TreeViewTag
					zIndex={0}
					tag={data}
					updateTag={setData}
					viewOnly={viewOnly}
					diffAnnotations={diffAnnotations}
				/>
				{/* Portal target for overlay sheets (mobile-only) */}
				<div
					ref={portalRef}
					className="fixed inset-0 pointer-events-none *:pointer-events-auto"
					style={{ zIndex: 39 }}
				/>
			</div>
		</OverlayPortalContext>
	);
}
