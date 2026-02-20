import type { Dispatch, SetStateAction } from "react";
import { IoCloudUploadOutline, IoDownloadOutline } from "react-icons/io5";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";

interface UploadNavBarProps {
	onUpload: () => void;
	canUpload: boolean;
	onImport: () => void;
	onDownload?: () => void;
	allowDownload: boolean;
	theme: any;
	setTheme: Dispatch<SetStateAction<any>>;
	language: string;
	setLanguage: Dispatch<SetStateAction<string>>;
	showLanguageSelect: boolean;
	filename: string;
	onFilenameChange: (value: string) => void;
	filenameReadOnly: boolean;
}

export default function UploadNavBar({
	onUpload,
	canUpload,
	onImport,
	onDownload,
	allowDownload,
	theme,
	setTheme,
	language,
	setLanguage,
	showLanguageSelect,
	filename,
	onFilenameChange,
	filenameReadOnly,
}: UploadNavBarProps) {
	return (
		<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full items-center flex-wrap">
			{/* Upload */}
			<button
				className="bg-blue-500 py-2 px-4 rounded-2xl text-white cursor-pointer hover:bg-blue-600 active:bg-blue-800 disabled:bg-neutral-500 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
				onClick={onUpload}
				disabled={!canUpload}
			>
				Upload
			</button>

			{/* Import from local file */}
			<button
				onClick={onImport}
				title="Import a local file into the editor"
				className="py-2 px-4 h-full rounded-2xl cursor-pointer transition-colors flex items-center gap-1 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200"
			>
				<IoCloudUploadOutline className="h-4 w-4" />
				<span>Import</span>
			</button>

			{/* Download editor content */}
			{onDownload && (
				<button
					onClick={onDownload}
					disabled={!allowDownload}
					title="Download editor content"
					className="
						py-2 px-4 h-full rounded-2xl cursor-pointer transition-colors flex items-center gap-1 text-sm
				 		bg-neutral-200 dark:bg-neutral-700 not-disabled:hover:bg-neutral-300 not-disabled:dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200
						disabled:bg-neutral-500 disabled:text-neutral-400 disabled:cursor-not-allowed"
				>
					<IoDownloadOutline className="h-4 w-4" />
					<span>Download</span>
				</button>
			)}

			<ThemeSelect theme={theme} setTheme={setTheme} />

			{/* Only show language selector for text files */}
			{showLanguageSelect && (
				<LanguageSelect language={language} setLanguage={setLanguage} />
			)}

			{/* Filename input */}
			<div className="flex items-center gap-1 ml-auto">
				<input
					type="text"
					placeholder="file.txt"
					value={filename}
					onChange={(e) => onFilenameChange(e.target.value)}
					readOnly={filenameReadOnly}
					title={
						filenameReadOnly
							? "Filename is set from the imported file"
							: "Enter a filename for the uploaded content"
					}
					className={`text-xs px-2 py-1.5 rounded-lg border dark:border-gray-600 border-gray-300 dark:bg-neutral-800 bg-white dark:text-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 w-44 ${
						filenameReadOnly ? "opacity-60 cursor-default" : ""
					}`}
				/>
			</div>

			<span className="text-xs text-gray-500 dark:text-gray-400">
				This link will expire automatically
			</span>
		</div>
	);
}
