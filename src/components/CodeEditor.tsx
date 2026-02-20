import { DiffEditor, Editor, useMonaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

import { decideLanguageFromExtension } from "../lib/language";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";
import LoadingState from "./states/LoadingState";
import UploadingState from "./states/UploadingState";
import UploadFailedState from "./states/UploadFailedState";
import {
	displayable,
	editable,
	EditorMode,
	isDiffMode,
	isViewOnly,
} from "../lib/editor";
import { disposeFile, fetchEditingFile, submitEdit } from "../lib/request";
import type { EditFileMetadata } from "../lib/server/request";
import {
	IoEyeSharp,
	IoDownloadOutline,
	IoCloudUploadOutline,
} from "react-icons/io5";
export default function CodeEditor({
	id,
	metadata,
}: {
	id: string;
	metadata: EditFileMetadata;
}) {
	const { extension, isDiff, isNBT, filename } = metadata;
	if (isNBT) {
		console.warn(
			"NBT file provided to CodeEditor, which is meant for text-based files. This file should be handled by TreeViewEditor instead.",
		);
	}

	const monaco = useMonaco();
	const [mode, setEditorMode] = useState(EditorMode.FileLoading);
	const [theme, setTheme] = useState<any>(null);
	const [content, setContent] = useState<string | null>(null);
	const [rawFileContent, setRawFileContent] = useState<string | null>(null);
	const [language, setLanguage] = useState<string>(
		decideLanguageFromExtension(extension),
	);

	// File-input ref for upload
	const uploadInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		(async () => {
			setEditorMode(EditorMode.FileLoading);
			const fileContent = await fetchEditingFile(id, false, false);
			if (fileContent === null) {
				window.location.href = "/edit/error";
				return;
			}
			if (isDiff) {
				try {
					const { raw, edited } = JSON.parse(fileContent);
					setRawFileContent(raw);
					setContent(edited);
					setEditorMode(EditorMode.EditDiff);
				} catch {
					window.location.href = "/edit/error";
				}
				return;
			}
			setContent(fileContent);
			setEditorMode(EditorMode.Edit);
		})();
	}, []);

	function retrieveDiffResult() {
		if (!monaco) return null;
		const model = monaco.editor
			.getDiffEditors()[0]
			?.getModifiedEditor()
			?.getModel();
		return model?.getValue() || null;
	}

	async function uploadFileHandler() {
		let result = content;
		if (!editable(mode) || !result) return;
		if (isDiffMode(mode)) {
			const diffResult = retrieveDiffResult();
			if (diffResult !== null) {
				setContent(diffResult);
				result = diffResult;
			} else {
				return setEditorMode(EditorMode.FileUploadFailed);
			}
		}
		setEditorMode(EditorMode.FileUploading);
		setEditorMode(
			(await submitEdit(id, result))
				? EditorMode.View
				: EditorMode.FileUploadFailed,
		);
	}

	async function disposeDiff() {
		setEditorMode(EditorMode.ViewDiff);
		if (await disposeFile(id)) return;
		setEditorMode(EditorMode.EditDiff);
	}

	// Download: save current editor content to disk
	function handleDownload() {
		const text = (() => {
			if (isDiffMode(mode)) {
				return retrieveDiffResult() ?? content ?? "";
			}
			return content ?? "";
		})();

		const blob = new Blob([text], { type: "application/octet-stream" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename ?? `file.${extension}`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Upload: replace editor content from a local file
	function triggerUpload() {
		uploadInputRef.current?.click();
	}

	function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";

		const reader = new FileReader();
		reader.onload = (evt) => {
			const text = evt.target?.result as string;
			setContent(text);
			// If we were in diff mode, switch to plain edit so the new content is usable
			if (isDiffMode(mode)) {
				setEditorMode(EditorMode.Edit);
			}
		};
		reader.readAsText(file);
	}

	// Plain-text / Monaco
	return (
		<>
			{/* Hidden file input */}
			<input
				ref={uploadInputRef}
				type="file"
				className="hidden"
				onChange={handleFileSelected}
			/>

			{displayable(mode) && !isDiffMode(mode) && content !== null && (
				<Editor
					language={language}
					theme={theme}
					defaultValue={content}
					onChange={(value) => setContent(value || "")}
					options={{ readOnly: isViewOnly(mode) }}
				/>
			)}
			{isDiffMode(mode) &&
				content !== null &&
				rawFileContent !== null && (
					<DiffEditor
						modified={content}
						original={rawFileContent}
						language={language}
						theme={theme}
						options={{
							readOnly: isViewOnly(mode),
						}}
					/>
				)}
			{mode === EditorMode.FileLoading && <LoadingState />}
			{mode === EditorMode.FileUploading && <UploadingState />}
			{mode === EditorMode.FileUploadFailed && (
				<UploadFailedState
					onRetry={() => setEditorMode(EditorMode.Edit)}
				/>
			)}
			<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full items-center flex-wrap">
				{/* Submit */}
				<button
					className="bg-blue-500 py-2 px-4 rounded-2xl text-white cursor-pointer disabled:cursor-auto hover:bg-blue-600 active:bg-blue-800 disabled:bg-neutral-500 disabled:text-neutral-400 transition-colors"
					disabled={
						mode === EditorMode.FileLoading || !editable(mode)
					}
					onClick={uploadFileHandler}
				>
					{isViewOnly(mode) ? "Submitted" : "Submit"}
				</button>

				{/* Deny (diff mode) */}
				{isDiffMode(mode) && editable(mode) && (
					<button
						onClick={disposeDiff}
						className="bg-red-500 py-2 px-4 rounded-2xl text-white cursor-pointer disabled:cursor-auto hover:bg-red-600 active:bg-red-800 disabled:bg-neutral-500 disabled:text-neutral-400 transition-colors"
					>
						Deny
					</button>
				)}

				{/* Upload from local file */}
				{editable(mode) && (
					<button
						onClick={triggerUpload}
						title="Replace editor content with a local file"
						className="py-2 px-4 h-full rounded-2xl cursor-pointer transition-colors flex items-center gap-1 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200"
					>
						<IoCloudUploadOutline className="h-5 w-5" />
						<span>Import</span>
					</button>
				)}

				{/* Download current content */}
				{displayable(mode) && content !== null && (
					<button
						onClick={handleDownload}
						title="Download current file content"
						className="py-2 px-4 h-full rounded-2xl cursor-pointer transition-colors flex items-center gap-1 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200"
					>
						<IoDownloadOutline className="h-5 w-5" />
						<span>Download</span>
					</button>
				)}

				<ThemeSelect theme={theme} setTheme={setTheme} />
				<LanguageSelect language={language} setLanguage={setLanguage} />

				<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mr-auto w-full flex-1 justify-end">
					{isViewOnly(mode) && (
						<>
							<IoEyeSharp className="h-4 w-4" />
							<span className="font-semibold">Read-only</span>
						</>
					)}
					<span className="text-xs">
						This link will expire automatically
					</span>
				</div>
			</div>
		</>
	);
}
