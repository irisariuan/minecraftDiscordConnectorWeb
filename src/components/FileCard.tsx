import { IoDocumentOutline, IoCloseSharp } from "react-icons/io5";

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileCardProps {
	file: File;
	onRemove: () => void;
}

export default function FileCard({ file, onRemove }: FileCardProps) {
	return (
		<div className="flex-1 flex items-center justify-center dark:bg-neutral-950 bg-neutral-100">
			<div className="dark:bg-neutral-800 bg-white border dark:border-neutral-700 border-neutral-200 rounded-2xl p-8 flex flex-col items-center gap-3 max-w-sm w-full mx-4 shadow-lg">
				<IoDocumentOutline className="h-14 w-14 text-neutral-400" />
				<p className="dark:text-white text-neutral-800 font-semibold text-lg text-center break-all">
					{file.name}
				</p>
				<p className="text-neutral-400 text-sm">
					{formatBytes(file.size)}
				</p>
				<p className="text-neutral-500 text-sm text-center">
					Binary file
				</p>
				<button
					onClick={onRemove}
					className="mt-2 text-sm text-red-200 hover:text-white active:text-red-500 active:bg-red-950 transition-colors flex items-center gap-1 cursor-pointer bg-red-500 p-2 rounded-xl"
				>
					<IoCloseSharp className="h-4 w-4" />
					Remove
				</button>
			</div>
		</div>
	);
}
