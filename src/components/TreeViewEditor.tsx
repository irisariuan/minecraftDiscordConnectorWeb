import { useEffect, useRef, useState } from "react";
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

	// Drag state
	const [isDragging, setIsDragging] = useState(false);
	const dragCounterRef = useRef(0);

	// Hidden file-input ref for the import feature
	const uploadInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		(async () => {
			setMode(TreeEditorMode.FileLoading);
			const result = await fetchEditingNbtFile(id, isBedrock);
			console.log("fetched nbt", result?.tag);
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

	function handleDragEnter(e: React.DragEvent) {
		e.preventDefault();
		dragCounterRef.current++;
		setIsDragging(true);
	}

	function handleDragLeave(e: React.DragEvent) {
		e.preventDefault();
		dragCounterRef.current--;
		if (dragCounterRef.current <= 0) {
			dragCounterRef.current = 0;
			setIsDragging(false);
		}
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		dragCounterRef.current = 0;
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) loadFile(file);
	}

	function loadFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = (e.target?.result as string) ?? "";
			try {
				const parsed = parse(text) as TreeTag<TreeTagType>;
				setTag(parsed);
				setMode(TreeEditorMode.Edit);
			} catch {
				console.error("Failed to parse dropped file as JSON");
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
					<div
						className="flex-1 flex flex-col"
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={(e) => e.preventDefault()}
						onDrop={handleDrop}
					>
						{isDragging && (
							<div className="absolute inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none">
								<p className="bg-blue-900/80 px-6 py-4 rounded-2xl text-blue-200 text-xl font-semibold select-none backdrop-blur-xl">
									Drop to import file
								</p>
							</div>
						)}
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
											viewOnly
											diffAnnotations={
												diffMaps?.originalMap
											}
										/>
									</div>
								</div>
								{/* Edited */}
								<div className="flex-1 flex flex-col overflow-hidden">
									<div className="px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400 border-b dark:border-gray-700 border-gray-300 bg-neutral-50 dark:bg-neutral-900">
										Edited
									</div>
									<div className="flex-1">
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
