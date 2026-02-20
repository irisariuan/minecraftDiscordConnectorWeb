import { useEffect, useState } from "react";
import NavBar from "./TreeView/NavBar";
import { type TreeTagType, type TreeTag } from "../lib/treeView/types";
import LoadingState from "./states/LoadingState";
import ErrorState from "./states/ErrorState";
import TreeViewBody from "./TreeView/TreeViewBody";
import { fetchEditingNbtFile, submitEdit } from "../lib/request";
import { stringify } from "json-bigint";

export enum TreeEditorMode {
	FileLoading,
	ViewOnly,
	Edit,
	Submitting,
	Submitted,
	SubmitFailed,
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
	const [mode, setMode] = useState(TreeEditorMode.FileLoading);
	const [tag, setTag] = useState<TreeTag<TreeTagType> | null>(null);
	const [originalTag, setOriginalTag] = useState<TreeTag<TreeTagType> | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			setMode(TreeEditorMode.FileLoading);
			const result = await fetchEditingNbtFile(id, isBedrock);
			if (!result) {
				setError("Failed to load NBT file");
				setMode(TreeEditorMode.SubmitFailed);
				return;
			}
			setTag(result.tag);
			if (result.original) setOriginalTag(result.original);
			setMode(TreeEditorMode.Edit);
		})();
	}, [id, isBedrock]);

	async function handleSubmit() {
		if (!tag || mode !== TreeEditorMode.Edit) return;
		setMode(TreeEditorMode.Submitting);
		const ok = await submitEdit(id, stringify(tag), {
			isNbt: true,
			isBedrock,
		});
		setMode(ok ? TreeEditorMode.Submitted : TreeEditorMode.SubmitFailed);
	}

	if (error && mode === TreeEditorMode.SubmitFailed && !tag) {
		return <ErrorState errorMessage={error} />;
	}

	return (
		<div className="flex flex-col h-full w-full overflow-hidden">
			{mode === TreeEditorMode.FileLoading && <LoadingState />}

			{mode !== TreeEditorMode.FileLoading && tag !== null && (
				<div className="flex-1 overflow-hidden flex flex-col">
					{isDiff && originalTag !== null && (
						<div className="flex flex-1 overflow-hidden">
							{/* Original (read-only) */}
							<div className="flex-1 flex flex-col overflow-hidden border-r dark:border-gray-700 border-gray-300">
								<div className="px-3 py-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 border-b dark:border-gray-700 border-gray-300 bg-neutral-50 dark:bg-neutral-900">
									Original
								</div>
								<div className="flex-1 overflow-auto">
									<TreeViewBody
										data={originalTag}
										setData={() => {}}
										isDiff={false}
										viewOnly
									/>
								</div>
							</div>
							{/* Edited */}
							<div className="flex-1 flex flex-col overflow-hidden">
								<div className="px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400 border-b dark:border-gray-700 border-gray-300 bg-neutral-50 dark:bg-neutral-900">
									Edited
								</div>
								<div className="flex-1 overflow-auto">
									<TreeViewBody
										data={tag}
										setData={(newTag) =>
											setTag(
												newTag as TreeTag<TreeTagType>,
											)
										}
										isDiff
										viewOnly={mode !== TreeEditorMode.Edit}
									/>
								</div>
							</div>
						</div>
					)}

					{!isDiff && (
						<div className="flex-1 overflow-hidden">
							<TreeViewBody
								data={tag}
								setData={(newTag) =>
									setTag(newTag as TreeTag<TreeTagType>)
								}
								isDiff={false}
								viewOnly={mode !== TreeEditorMode.Edit}
							/>
						</div>
					)}
				</div>
			)}

			<NavBar mode={mode} setMode={setMode} onSubmit={handleSubmit} />
		</div>
	);
}
