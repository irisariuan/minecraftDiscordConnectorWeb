export default function UploadingState() {
	return (
		<div className="h-full w-full flex flex-col items-center justify-center">
			<p className="text-white animate-pulse text-4xl">Uploading...</p>
			<p className="text-neutral-300 mt-2">
				Please do not close this window or navigate away until the
				upload is complete.
			</p>
		</div>
	);
}
