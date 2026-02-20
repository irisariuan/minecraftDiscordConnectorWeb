import type { Dispatch, SetStateAction } from "react";
import { TreeEditorMode } from "../TreeViewEditor";
import { IoCheckmarkSharp, IoCloseSharp } from "react-icons/io5";

export default function NavBar({
	mode,
	setMode,
	onSubmit,
	onDeny,
}: {
	mode: TreeEditorMode;
	setMode: Dispatch<SetStateAction<TreeEditorMode>>;
	onSubmit: () => void;
	onDeny?: () => void;
}) {
	const isSubmitting = mode === TreeEditorMode.Submitting;
	const isSubmitted = mode === TreeEditorMode.Submitted;
	const isFailed = mode === TreeEditorMode.SubmitFailed;
	const canSubmit = mode === TreeEditorMode.Edit;

	return (
		<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full items-center sticky bottom-0 bg-gray-100/60 dark:bg-gray-900/60 backdrop-blur-3xl">
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

			{onDeny && mode === TreeEditorMode.Edit && (
				<button
					onClick={onDeny}
					className="bg-red-500 py-2 px-4 rounded-2xl text-white cursor-pointer hover:bg-red-600 active:bg-red-800 transition-colors"
				>
					Deny
				</button>
			)}

			<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-auto">
				<span className="text-xs">
					This link will expire automatically
				</span>
			</div>
		</div>
	);
}
