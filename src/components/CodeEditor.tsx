import { DiffEditor, Editor, useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";

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
import { IoEyeSharp } from "react-icons/io5";

export default function CodeEditor({
	id,
	metadata,
}: {
	id: string;
	metadata: EditFileMetadata;
}) {
	const { extension, isDiff } = metadata;
	const monaco = useMonaco();
	const [mode, setEditorMode] = useState(EditorMode.FileLoading);
	const [theme, setTheme] = useState<any>(null);
	const [content, setContent] = useState<string | null>(null);
	const [rawFileContent, setRawFileContent] = useState<string | null>(null);
	const [language, setLanguage] = useState<string>(
		decideLanguageFromExtension(extension),
	);
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

	return (
		<>
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
			<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full items-center">
				<button
					className=" bg-blue-500 py-2 px-4 rounded-2xl text-white cursor-pointer disabled:cursor-auto hover:bg-blue-600 active:bg-blue-800 disabled:bg-neutral-500 disabled:text-neutral-400 transition-colors"
					disabled={
						mode === EditorMode.FileLoading || !editable(mode)
					}
					onClick={uploadFileHandler}
				>
					{isViewOnly(mode) ? "Submitted" : "Submit"}
				</button>
				{isDiffMode(mode) && editable(mode) && (
					<button
						onClick={disposeDiff}
						className=" bg-red-500 py-2 px-4 rounded-2xl text-white cursor-pointer disabled:cursor-auto hover:bg-red-600 active:bg-red-800 disabled:bg-neutral-500 disabled:text-neutral-400 transition-colors"
					>
						Deny
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
