import { IoClose } from "react-icons/io5";
import type { TreeTag, TreeTagType } from "../../lib/treeView/types";
import { useEffect, useRef, useState } from "react";
import { getIcon } from "../../lib/treeView/component";
import Display from "./Display";

export default function PathTransversalButton({
	path,
	onSelectPath,
	onClick,
	title,
}: {
	path: TreeTag<TreeTagType>[];
	onSelectPath: (tag: TreeTag<TreeTagType>, index: number) => void;
	onClick?: () => void;
	title: string;
}) {
	const timeout = useRef<NodeJS.Timeout | null>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [showSelectPath, setShowSelectPath] = useState(false);

	useEffect(() => {
		if (!showSelectPath) return;

		function handleClickOutside(event: MouseEvent | TouchEvent) {
			if (
				panelRef.current &&
				!panelRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setShowSelectPath(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("touchstart", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		};
	}, [showSelectPath]);

	function startTimeout() {
		if (timeout.current) {
			clearTimeout(timeout.current);
		}
		timeout.current = setTimeout(() => {
			timeout.current = null;
			setShowSelectPath(true);
		}, 500);
	}

	function cancelTimeout() {
		if (timeout.current) {
			clearTimeout(timeout.current);
			timeout.current = null;
		}
	}

	return (
		<div className="relative">
			<button
				onClick={onClick}
				onMouseDown={startTimeout}
				onMouseUp={cancelTimeout}
				onTouchStart={startTimeout}
				onTouchCancel={cancelTimeout}
				onTouchEnd={cancelTimeout}
				ref={buttonRef}
				className="shrink-0 ml-2 p-1 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 text-neutral-500 dark:text-neutral-400 transition-colors select-none cursor-pointer"
				title={title}
			>
				<IoClose className="h-5 w-5" />
			</button>
			{showSelectPath && (
				<div
					ref={panelRef}
					className="z-10000 absolute top-1 h-min w-max min-h-10 px-1 right-6 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-2xl border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-lg"
				>
					{path.map((tag, index) => {
						console.log(tag.type);
						return (
							<button
								key={tag.name + index.toString()}
								onClick={() => {
									onSelectPath(tag, index);
									setShowSelectPath(false);
								}}
								disabled={index === path.length - 1}
								className={`flex items-center gap-2 w-full text-left my-1 rounded p-2 ${index === path.length - 1 ? "text-neutral-500 bg-neutral-200 dark:bg-neutral-800" : "text-neutral-600 dark:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60"} text-sm`}
							>
								{getIcon(tag.type, "", 18)}
								<Display
									disabled
									enableToolbar={false}
									defaultValue={tag.name}
									placeholderText="(unnamed)"
									className="placeholder:text-neutral-400 placeholder:italic"
									overrideClassName
									onDoubleClick={() => {
										onSelectPath(tag, index);
										setShowSelectPath(false);
									}}
								/>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
