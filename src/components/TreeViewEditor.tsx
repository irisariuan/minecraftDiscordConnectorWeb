import { useState } from "react";
import NavBar from "./TreeView/NavBar";
import TreeViewBody from "./TreeView/TreeViewBody";
import LoadingState from "./states/LoadingState";
import testData from "../../public/level.json";

export enum TreeEditorMode {
	FileLoading,
	ViewOnly,
	Edit,
	Submitted,
}

export default function TreeViewEditor() {
	const [mode, setMode] = useState(TreeEditorMode.Edit);
	return (
		<div className="flex flex-col h-full w-full">
			{mode !== TreeEditorMode.FileLoading && (
				<TreeViewBody data={testData as any}  />
			)}
			{mode === TreeEditorMode.FileLoading && <LoadingState />}
			<NavBar mode={mode} />
		</div>
	);
}
