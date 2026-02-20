import { useEffect, useState } from "react";
import { stringify } from "../lib/jsonBigInt";
import {
	IoCheckmarkSharp,
	IoDownloadOutline,
	IoEyeSharp,
} from "react-icons/io5";
import type { TreeTag, TreeTagType } from "../lib/treeView/types";
import { fetchViewNbtFile } from "../lib/request";
import LoadingState from "./states/LoadingState";
import ErrorState from "./states/ErrorState";
import TreeViewBody from "./TreeView/TreeViewBody";

export default function ViewTreeEditor({
	id,
	filename,
}: {
	id: string;
	filename: string;
}) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [tag, setTag] = useState<TreeTag<TreeTagType> | null>(null);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const result = await fetchViewNbtFile(id, false);
				if (result) {
					setTag(result.tag);
					return;
				}
				setError("Failed to load file");
			} catch {
				setError("Failed to connect to server");
			} finally {
				setLoading(false);
			}
		})();
	}, [id]);

	async function copyToClipboard() {
		const text = tag !== null ? stringify(tag, null, 2) : null;
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			console.log("Failed to copy to clipboard");
		}
	}

	function handleDownload() {
		if (tag === null) return;
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

	if (loading) return <LoadingState />;
	if (error || tag === null) {
		return <ErrorState errorMessage={error ?? "File not found"} />;
	}

	return (
		<div className="flex flex-col h-full w-full overflow-hidden">
			<div className="flex-1 overflow-auto">
				<TreeViewBody
					data={tag}
					setData={() => {}}
					viewOnly
				/>
			</div>
			<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full items-center flex-wrap">
				{/* Copy */}
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
						<span>
							{tag !== null ? "Copy as JSON" : "Copy Content"}
						</span>
					)}
				</button>

				{/* Download */}
				<button
					onClick={handleDownload}
					title="Download file"
					className="py-2 px-4 rounded-2xl cursor-pointer transition-colors flex items-center gap-1 text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200"
				>
					<IoDownloadOutline className="h-4 w-4" />
					<span>Download</span>
				</button>

				<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-auto">
					<IoEyeSharp className="h-4 w-4" />
					<span className="font-semibold">Read-only</span>
					<span className="text-xs">
						This link will expire automatically
					</span>
				</div>
			</div>
		</div>
	);
}
