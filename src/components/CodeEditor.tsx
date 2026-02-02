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
import { fetchEditingFile, submitEdit } from "../lib/request";

export default function CodeEditor({
	fileName,
	id,
	isDiff,
	extension,
}: {
	fileName: string;
	id: string;
	isDiff: boolean;
	extension: string;
}) {
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
			const fileContent = await fetchEditingFile(id);
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
			<div className="p-2 flex gap-2">
				<button
					className=" bg-blue-500 py-2 px-4 rounded-2xl text-white cursor-pointer disabled:cursor-auto hover:bg-blue-600 active:bg-blue-800 disabled:bg-neutral-500 disabled:text-neutral-400 transition-colors"
					disabled={
						mode === EditorMode.FileLoading || !editable(mode)
					}
					onClick={async () => {
						let result = content;
						if (!editable(mode) || !result) return;
						if (isDiffMode(mode)) {
							const diffResult = retrieveDiffResult();
							if (diffResult !== null) {
								setContent(diffResult);
								result = diffResult;
							} else {
								return setEditorMode(
									EditorMode.FileUploadFailed,
								);
							}
						}
						setEditorMode(EditorMode.FileUploading);
						setEditorMode(
							(await submitEdit(id, result))
								? EditorMode.View
								: EditorMode.FileUploadFailed,
						);
					}}
				>
					{isViewOnly(mode) ? "Submitted" : "Submit"}
				</button>
				<ThemeSelect theme={theme} setTheme={setTheme} />
				<LanguageSelect language={language} setLanguage={setLanguage} />
			</div>
		</>
	);
}
