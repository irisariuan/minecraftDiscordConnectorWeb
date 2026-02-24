interface ErrorStateProps {
	errorMessage: string;
}

export default function ErrorState({ errorMessage }: ErrorStateProps) {
	const handleReload = () => {
		window.location.reload();
	};

	return (
		<div className="flex flex-col items-center justify-center h-full gap-4">
			<h1 className="text-red-500 dark:text-red-400 text-3xl font-semibold">
				Error
			</h1>
			<h2>{errorMessage}</h2>
			<button
				onClick={handleReload}
				className="bg-blue-500 hover:bg-blue-600 active:bg-blue-800 text-white py-2 px-4 rounded-2xl transition-colors cursor-pointer"
			>
				Reload Page
			</button>
		</div>
	);
}
