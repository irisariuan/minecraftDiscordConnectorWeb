import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { IoCheckmarkSharp, IoEyeSharp } from "react-icons/io5";

import { decideLanguageFromExtension } from "../lib/language";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";
import LoadingState from "./states/LoadingState";
import ErrorState from "./states/ErrorState";
import { fetchViewFile } from "../lib/request";

export default function ViewCodeEditor({
	id,
	extension,
}: {
	id: string;
	extension: string;
}) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [theme, setTheme] = useState<any>(null);
	const [content, setContent] = useState<string | null>(null);
	const [language, setLanguage] = useState<string>(
		decideLanguageFromExtension(extension),
	);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const result = await fetchViewFile(id);
				if (!result.success) {
					setError(result.error ?? "Error loading file");
					return;
				}
				setContent(result.content ?? "");
			} catch (err) {
				setError("Failed to connect to server");
			} finally {
				setLoading(false);
			}
		})();
	}, [id]);

	const copyToClipboard = async () => {
		if (!content) return;
		try {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
			alert("Failed to copy to clipboard");
		}
	};

	if (loading) {
		return <LoadingState />;
	}

	if (error) {
		return <ErrorState errorMessage="File not found" />;
	}

	return (
		<>
			{content !== null && (
				<Editor
					language={language}
					theme={theme}
					value={content}
					options={{
						readOnly: true,
						domReadOnly: true,
						renderValidationDecorations: "off",
						cursorStyle: "line",
						lineNumbers: "on",
						minimap: { enabled: true },
						scrollBeyondLastLine: false,
						wordWrap: "on",
					}}
				/>
			)}
			<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full">
				<button
					className={`py-2 px-4 rounded-2xl text-white cursor-pointer transition-colors text-sm flex gap-1 items-center justify-center ${
						copied
							? "bg-green-500 hover:bg-green-600"
							: "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
					}`}
					onClick={copyToClipboard}
				>
					{copied ? (
						<>
							<IoCheckmarkSharp />
							<span>Copied!</span>
						</>
					) : (
						<span>Copy Content</span>
					)}
				</button>
				<ThemeSelect theme={theme} setTheme={setTheme} />
				<LanguageSelect language={language} setLanguage={setLanguage} />
				<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mr-auto flex-1 w-full justify-end">
					<IoEyeSharp className="h-4 w-4" />
					<span className="font-semibold">Read-only</span>
					<span className="text-xs">
						This link will expire automatically
					</span>
				</div>
			</div>
		</>
	);
}
