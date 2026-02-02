export default function UploadFailedState({
	onRetry,
}: {
	onRetry: () => void;
}) {
	return (
		<div className="h-full w-full flex flex-col items-center justify-center">
			<p className="text-red-400 text-4xl">Upload Failed</p>
			<p className="text-neutral-300 mt-2">
				There was an error uploading your file. Please try again.
			</p>
			<button
				className="mt-4 bg-red-500 py-2 px-4 rounded-2xl text-white cursor-pointer hover:bg-red-600 active:bg-red-800 transition-colors"
				onClick={onRetry}
			>
				Return to Editor
			</button>
		</div>
	);
}
