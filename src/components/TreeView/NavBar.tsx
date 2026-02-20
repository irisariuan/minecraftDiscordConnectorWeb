import { TreeEditorMode } from "../TreeViewEditor";
import {
	IoCheckmarkSharp,
	IoCloseSharp,
	IoDownloadOutline,
	IoCloudUploadOutline,
} from "react-icons/io5";

export default function NavBar({
	mode,
	onSubmit,
	onDeny,
	onDownload,
	onUpload,
	isFallback,
}: {
	mode: TreeEditorMode;
	onSubmit: () => void;
	onDeny?: () => void;
	onDownload?: () => void;
	onUpload?: () => void;
	/** True when the NBT parser failed and we are showing a raw-text fallback */
	isFallback?: boolean;
}) {
	const isSubmitting = mode === TreeEditorMode.Submitting;
	const isSubmitted = mode === TreeEditorMode.Submitted;
	const isFailed = mode === TreeEditorMode.SubmitFailed;
	const canSubmit = mode === TreeEditorMode.Edit;

	return (
		<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full items-center sticky bottom-0 bg-gray-100/60 dark:bg-gray-900/60 backdrop-blur-3xl flex-wrap">
			{/* Submit */}
			<button
				className={`py-2 px-4 rounded-2xl text-white cursor-pointer disabled:cursor-auto transition-colors flex items-center gap-1 ${
					isSubmitted
						? "bg-green-500 hover:bg-green-600"
						: isFailed
							? "bg-red-500 hover:bg-red-600"
							: "bg-blue-500 hover:bg-blue-600 active:bg-blue-800 disabled:bg-neutral-500 disabled:text-neutral-400"
				}`}
				disabled={!canSubmit || isSubmitting}
				onClick={onSubmit}
			>
				{isSubmitted && (
					<>
						<IoCheckmarkSharp />
						<span>Submitted</span>
					</>
				)}
				{isFailed && (
					<>
						<IoCloseSharp />
						<span>Failed — Retry</span>
					</>
				)}
				{!isSubmitted && !isFailed && (
					<span>{isSubmitting ? "Submitting…" : "Submit"}</span>
				)}
			</button>

			{/* Deny (diff mode) */}
			{onDeny && mode === TreeEditorMode.Edit && (
				<button
					onClick={onDeny}
					className="bg-red-500 py-2 px-4 rounded-2xl text-white cursor-pointer hover:bg-red-600 active:bg-red-800 transition-colors"
				>
					Deny
				</button>
			)}

			{onUpload && (
				<button
					onClick={onUpload}
					title="Import JSON file into editor"
					className="py-2 px-4 rounded-2xl cursor-pointer transition-colors flex items-center gap-1 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 disabled:opacity-50"
					disabled={isSubmitting || isSubmitted}
				>
					<IoCloudUploadOutline className="h-4 w-4" />
					<span>Import</span>
				</button>
			)}

			{onDownload && (
				<button
					onClick={onDownload}
					title="Download current content"
					className="py-2 px-4 rounded-2xl cursor-pointer transition-colors flex items-center gap-1 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200"
				>
					<IoDownloadOutline className="h-4 w-4" />
					<span>Download</span>
				</button>
			)}

			{/* Fallback warning badge */}
			{isFallback && (
				<span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
					⚠ NBT parse failed — raw fallback
				</span>
			)}

			<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-auto">
				<span className="text-xs">
					This link will expire automatically
				</span>
			</div>
		</div>
	);
}
