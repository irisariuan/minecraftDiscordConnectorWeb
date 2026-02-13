import { useEffect, useState } from "react";
import NavBar from "./TreeView/NavBar";
import {
	TreeTagContainerType,
	type TreeTagType,
	type TreeTag,
} from "../lib/treeView/types";
import LoadingState from "./states/LoadingState";
import TreeViewBody from "./TreeView/TreeViewBody";
import { fetchEditingFile } from "../lib/request";

export enum TreeEditorMode {
	FileLoading,
	ViewOnly,
	Edit,
	Submitted,
}

export default function TreeViewEditor({
	id,
	isBedrock,
	isDiff,
}: {
	id: string;
	isBedrock: boolean;
	isDiff: boolean;
}) {
	const [mode, setMode] = useState(TreeEditorMode.Edit);
	const [tag, setTag] = useState<TreeTag<TreeTagType> | null>(null);
	useEffect(() => {
		(async () => {
			setMode(TreeEditorMode.FileLoading);
			const result = await fetchEditingFile(id, true, isBedrock);
			if (!result) {
				window.location.href = "/error";
				return;
			}
			setTag(result);
			setMode(TreeEditorMode.Edit);
		})();
	});
	return (
		<div className="flex flex-col h-full w-full">
			{mode !== TreeEditorMode.FileLoading && tag !== null && (
				<TreeViewBody
					data={tag}
					setData={setTag}
					isDiff={isDiff}
					viewOnly={mode === TreeEditorMode.ViewOnly}
				/>
			)}
			{mode === TreeEditorMode.FileLoading && <LoadingState />}
			<NavBar mode={mode} setMode={setMode} />
		</div>
	);
}
