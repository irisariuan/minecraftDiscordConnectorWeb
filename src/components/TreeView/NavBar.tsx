import { TreeEditorMode } from "../TreeViewEditor";

export default function NavBar({ mode }: { mode: TreeEditorMode }) {
	return (
		<div className="p-2 flex gap-2 border-t dark:border-gray-700 border-gray-300 w-full items-center sticky bottom-0 bg-gray-100/60 dark:bg-gray-900/60 backdrop-blur-3xl">
			<button
				className=" bg-blue-500 py-2 px-4 rounded-2xl text-white cursor-pointer disabled:cursor-auto hover:bg-blue-600 active:bg-blue-800 disabled:bg-neutral-500 disabled:text-neutral-400 transition-colors"
				disabled={mode !== TreeEditorMode.Edit}
				onClick={() => {}}
			>
				{mode === TreeEditorMode.Submitted ? "Submitted" : "Submit"}
			</button>
		</div>
	);
}
