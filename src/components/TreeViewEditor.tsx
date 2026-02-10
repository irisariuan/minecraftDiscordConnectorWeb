import { useState } from "react";
import NavBar from "./TreeView/NavBar";
import TreeViewBody, {
	TreeTagContainerType,
	type TreeTagType,
	type TreeTag,
} from "./TreeView/TreeViewBody";
import LoadingState from "./states/LoadingState";

export enum TreeEditorMode {
	FileLoading,
	ViewOnly,
	Edit,
	Submitted,
}

export default function TreeViewEditor({
	data,
}: {
	data: TreeTag<TreeTagContainerType>;
}) {
	const [mode, setMode] = useState(TreeEditorMode.Edit);
	const [tag, setTag] = useState<TreeTag<TreeTagType>>(data);
	return (
		<div className="flex flex-col h-full w-full">
			{mode !== TreeEditorMode.FileLoading && (
				<TreeViewBody data={tag} setData={setTag} />
			)}
			{mode === TreeEditorMode.FileLoading && <LoadingState />}
			<NavBar mode={mode} />
		</div>
	);
}
