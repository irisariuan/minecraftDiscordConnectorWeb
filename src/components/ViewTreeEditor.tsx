import { useEffect, useState } from "react";
import { IoCheckmarkSharp, IoEyeSharp } from "react-icons/io5";
import type { TreeTag, TreeTagType } from "../lib/treeView/types";
import { fetchViewNbtFile } from "../lib/request";
import LoadingState from "./states/LoadingState";
import ErrorState from "./states/ErrorState";
import TreeViewBody from "./TreeView/TreeViewBody";
import { stringify } from "json-bigint";

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
				if (!result) {
					setError("Failed to load NBT file");
					return;
				}
				setTag(result.tag);
			} catch {
				setError("Failed to connect to server");
			} finally {
				setLoading(false);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const copyToClipboard = async () => {
		if (!tag) return;
		try {
			await navigator.clipboard.writeText(stringify(tag, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			alert("Failed to copy to clipboard");
		}
	};

	if (loading) return <LoadingState />;
	if (error || !tag) return <ErrorState errorMessage={error ?? "File not found"} />;

	return (
		<div className="flex flex-col h-full w-full overflow-hidden">
			<div className="flex-1 overflow-auto">
				<TreeViewBody
					data={tag}
					setData={() => {}}
					isDiff={false}
					viewOnly
				/>
			</div>

			<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full items-center">
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
						<span>Copy as JSON</span>
					)}
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
