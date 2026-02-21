import { useEffect, useRef, useState } from "react";
import { MdVerticalSplit, MdViewAgenda } from "react-icons/md";
import { fetchEditingNbtFile, submitEdit } from "../lib/request";
import { parse, stringify } from "../lib/jsonBigInt";
import { type TreeTag, type TreeTagType } from "../lib/treeView/types";
import ErrorState from "./states/ErrorState";
import LoadingState from "./states/LoadingState";
import NavBar from "./TreeView/NavBar";
import TreeViewBody from "./TreeView/TreeViewBody";
import { computeDiffMaps, type DiffMaps } from "../lib/treeView/diff";

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
	filename,
}: {
	id: string;
	isBedrock: boolean;
	isDiff: boolean;
	filename?: string;
}) {
	const [mode, setMode] = useState(TreeEditorMode.FileLoading);
	const [tag, setTag] = useState<TreeTag<TreeTagType> | null>(null);
	const [originalTag, setOriginalTag] = useState<TreeTag<TreeTagType> | null>(
		null,
	);
	const [diffMaps, setDiffMaps] = useState<DiffMaps | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [hiding, setHiding] = useState<null | "original" | "edited">(null);
	
	// Hidden file-input ref for the import feature
	const uploadInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		(async () => {
			setMode(TreeEditorMode.FileLoading);
			const result = await fetchEditingNbtFile(id, isBedrock);
			if (!result) {
				setError("Failed to load file");
				setMode(TreeEditorMode.SubmitFailed);
				return;
			}
			setTag(result.tag);
			if (result.original) setOriginalTag(result.original);
			setMode(TreeEditorMode.Edit);
		})();
	}, [id, isBedrock]);

	// Recompute diff annotations whenever tag or originalTag changes
	useEffect(() => {
		if (isDiff && tag && originalTag) {
			setDiffMaps(computeDiffMaps(originalTag, tag));
		} else {
			setDiffMaps(null);
		}
	}, [tag, originalTag, isDiff]);

	async function handleSubmit() {
		if (!tag || mode !== TreeEditorMode.Edit) return;
		setMode(TreeEditorMode.Submitting);
		const ok = await submitEdit(id, stringify(tag), {
			isNbt: true,
			isBedrock,
		});
		setMode(ok ? TreeEditorMode.Submitted : TreeEditorMode.SubmitFailed);
	}

	function handleDownload() {
		if (!tag) return;
		const content = stringify(tag, null, 2);
		const base = filename ? filename.replace(/\.[^.]+$/, "") : "nbt-export";
		const downloadFilename = `${base}.json`;

		const blob = new Blob([content], { type: "application/octet-stream" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = downloadFilename;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Upload / import
	function triggerUpload() {
		uploadInputRef.current?.click();
	}

	function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		// Reset so the same file can be re-selected
		e.target.value = "";

		const reader = new FileReader();
		reader.onload = (evt) => {
			const text = evt.target?.result as string;

			// NBT mode: expect a JSON file exported by this editor
			try {
				const parsed = parse(text) as TreeTag<TreeTagType>;
				setTag(parsed);
				setMode(TreeEditorMode.Edit);
			} catch {
				console.error("Failed to parse uploaded file as JSON");
			}
		};
		reader.readAsText(file);
	}

	// Pure error (no content at all)
	if (error && mode === TreeEditorMode.SubmitFailed && !tag) {
		return <ErrorState errorMessage={error} />;
	}

	return (
		<div className="flex flex-col h-full w-full">
			{/* Hidden file input for import */}
			<input
				ref={uploadInputRef}
				type="file"
				accept=".json,.dat,.nbt,.txt"
				className="hidden"
				onChange={handleFileSelected}
			/>

			{mode === TreeEditorMode.FileLoading && <LoadingState />}

			{mode !== TreeEditorMode.FileLoading && tag !== null && (
				<>
					<div className="flex-1 flex flex-col">
						{isDiff && originalTag !== null && (
							<div className="flex flex-col flex-1 min-h-0">
								{/* Pane toggle bar */}
								<div className="sticky top-0 z-10 flex items-center border-b dark:border-gray-700 border-gray-300 bg-neutral-50 dark:bg-neutral-900 flex-col">
									<div className="flex w-full gap-1 px-2 py-1 items-center">
										<p className="text-xs text-neutral-400 dark:text-neutral-500 mr-1 select-none">
											View:
										</p>
										<button
											onClick={() => setHiding(null)}
											title="Show both panes side by side"
											className={`flex items-center gap-1 px-2 rounded text-sm transition-colors ${
												hiding === null
													? "bg-blue-500 text-white"
													: "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
											}`}
										>
											<MdVerticalSplit size={13} />
											<span>Split</span>
										</button>
										<button
											onClick={() => setHiding("edited")}
											title="Show only the Original pane"
											className={`flex items-center gap-1 px-2 rounded text-sm transition-colors ${
												hiding === "edited"
													? "bg-blue-500 text-white"
													: "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
											}`}
										>
											<MdViewAgenda
												size={13}
												className="rotate-90"
											/>
											<span>Original</span>
										</button>
										<button
											onClick={() =>
												setHiding("original")
											}
											title="Show only the Edited pane"
											className={`flex items-center gap-1 px-2 rounded text-sm transition-colors ${
												hiding === "original"
													? "bg-blue-500 text-white"
													: "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
											}`}
										>
											<MdViewAgenda
												size={13}
												className="rotate-90"
											/>
											<span>Edited</span>
										</button>
									</div>
									<div className="flex w-full border-t dark:border-gray-700 border-gray-300">
										{hiding !== "original" && (
											<p className="p-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex-1 text-center border-r dark:border-gray-700 border-gray-300">
												Original
											</p>
										)}
										{hiding !== "edited" && (
											<p className="p-1 text-xs font-semibold text-green-600 dark:text-green-400 flex-1 text-center">
												Edited
											</p>
										)}
									</div>
								</div>

								<div className="flex flex-1 min-h-0 overflow-hidden w-full">
									{/* Original (read-only) */}
									{hiding !== "original" && (
										<div
											className={
												"flex-1 overflow-scroll" +
												(hiding === null
													? " border-r dark:border-gray-700 border-gray-300"
													: "")
											}
										>
											<TreeViewBody
												data={originalTag}
												setData={() => {}}
												viewOnly
												diffAnnotations={
													diffMaps?.originalMap
												}
											/>
										</div>
									)}
									{/* Edited */}
									{hiding !== "edited" && (
										<div className="flex-1 overflow-scroll">
											<TreeViewBody
												data={tag}
												setData={setTag}
												viewOnly={
													mode !== TreeEditorMode.Edit
												}
												diffAnnotations={
													diffMaps?.editedMap
												}
											/>
										</div>
									)}
								</div>
							</div>
						)}

						{!isDiff && (
							<div className="flex-1 overflow-hidden">
								<TreeViewBody
									data={tag}
									setData={setTag}
									viewOnly={mode !== TreeEditorMode.Edit}
								/>
							</div>
						)}
						<NavBar
							mode={mode}
							onSubmit={handleSubmit}
							onDownload={handleDownload}
							onUpload={triggerUpload}
						/>
					</div>
				</>
			)}
		</div>
	);
}
