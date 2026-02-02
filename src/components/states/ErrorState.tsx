interface ErrorStateProps {
	errorMessage: string;
}

export default function ErrorState({ errorMessage }: ErrorStateProps) {
	const handleReload = () => {
		window.location.reload();
	};

	return (
		<div className="bg-linear-to-b from-red-700 to-red-800 w-full flex-1 flex items-center justify-center gap-4 flex-col p-4">
			<p className="text-white text-5xl">Error</p>
			<p className="text-red-300 text-xl">{errorMessage}</p>
			<button
				onClick={handleReload}
				className="text-white border border-px border-white p-4 w-full rounded-4xl hover:cursor-pointer hover:bg-white hover:text-red-800 transition-colors"
			>
				Reload
			</button>
		</div>
	);
}
