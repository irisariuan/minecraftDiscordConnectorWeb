import { useEffect, useState, type ReactNode } from "react";
import { IoCaretDown, IoCaretUp, IoTrash, IoClose } from "react-icons/io5";
import {
	AnimatePresence,
	motion,
	useDragControls,
	type PanInfo,
} from "motion/react";
import {
	bg2ColorRef,
	bgColorRef,
	border2ColorRef,
	borderColorRef,
	getIcon,
	textColorRef,
} from "../../lib/treeView/component";
import {
	TreeTagContainerType,
	type TreeTag,
	type TreeTagType,
} from "../../lib/treeView/types";
import { diffBgClass, type DiffStatus } from "../../lib/treeView/diff";
import { useIsNarrowScreen } from "../../hooks/useIsNarrowScreen";
import {
	OverlayDepthContext,
	useOverlayPath,
	useOverlayCloseSignal,
} from "./OverlayContext";
import Display from "./Display";
import AddChildForm, { isAddableType, TYPE_LABELS } from "./AddChildForm";
import PathTransversalButton from "./PathTransversalButton";
import ToolBarLabel from "./ToolBarLabel";

export default function TreeViewTagFoldableBody({
	children,
	tag,
	zIndex,
	updateTag,
	noTitle,
	viewOnly,
	diffStatus,
	onDelete,
	onAddChild,
}: {
	tag: TreeTag<TreeTagType>;
	viewOnly: boolean;
	children?: ReactNode;
	zIndex: number;
	updateTag: (tag: TreeTag<TreeTagType>) => void;
	noTitle?: boolean;
	diffStatus?: DiffStatus;
	onDelete?: () => void;
	onAddChild?: (item: string | number | TreeTag<TreeTagType>) => void;
}) {
	const isNarrow = useIsNarrowScreen();
	const overlayPath = useOverlayPath();
	const overlayDepth = overlayPath.length;
	const closeSignal = useOverlayCloseSignal();

	// Subscribe to the close signal so ancestor path traversal can close this sheet.
	useEffect(() => {
		return closeSignal.subscribe((targetDepth: number) => {
			if (overlayDepth > targetDepth) {
				setIsFullscreen(false);
				setShowChildren(false);
			}
		});
	}, [closeSignal, overlayDepth]);

	// Start collapsed on narrow screens so no sheets auto-open on load.
	const [showChildren, setShowChildren] = useState<boolean>(() => !isNarrow);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const dragControls = useDragControls();

	const bgClass = diffStatus ? diffBgClass[diffStatus] : "";

	// Each nested overlay sits above the previous one.
	// Depth 0 → backdrop z=40  sheet z=41
	// Depth 1 → backdrop z=50  sheet z=51  … etc.
	const backdropZ = 40 + overlayDepth * 10;
	const sheetZ = backdropZ + 1;

	const useOverlay = isNarrow && showChildren;

	const addForm =
		!viewOnly && onAddChild ? (
			<AddChildForm
				containerType={tag.type as TreeTagContainerType}
				onAdd={onAddChild}
			/>
		) : null;

	function handleDragEnd(_: PointerEvent, info: PanInfo) {
		const vy = info.velocity.y;
		const oy = info.offset.y;

		if (isFullscreen) {
			// Fast or far down → close entirely; moderate down → exit fullscreen
			if (vy > 1200 || oy > 280) {
				setIsFullscreen(false);
				setShowChildren(false);
			} else if (vy > 200 || oy > 80) {
				setIsFullscreen(false);
			}
		} else {
			// Swipe down → close; swipe up → fullscreen
			if (vy > 400 || oy > 120) {
				setShowChildren(false);
			} else if (vy < -400 || oy < -60) {
				setIsFullscreen(true);
			}
		}
	}

	return (
		<div title={tag.type} className="my-1">
			{/* Header row */}
			<div className={`flex items-center gap-1 rounded ${bgClass}`}>
				<div className="flex items-center justify-center p-1 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-500 shrink-0">
					{getIcon(tag.type)}
				</div>

				{!noTitle && (
					<Display
						validate={() => true}
						onSuccess={(s) => {
							updateTag({ ...tag, name: s });
							return s;
						}}
						defaultValue={tag.name}
						disabled={viewOnly}
						onDoubleClick={() => {
							if (viewOnly) setShowChildren(true);
						}}
						toolbarElement={
							<ToolBarLabel>
								{isAddableType(tag.type)
									? TYPE_LABELS[tag.type]
									: tag.type}
							</ToolBarLabel>
						}
					/>
				)}

				<button
					className="hover:cursor-pointer ml-auto"
					onClick={() => setShowChildren((prev) => !prev)}
				>
					{children &&
						(showChildren ? <IoCaretUp /> : <IoCaretDown />)}
				</button>

				{!viewOnly && onDelete && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className="shrink-0 p-1 text-neutral-400 hover:text-red-50 dark:hover:text-red-400 dark:hover:bg-red-900 hover:bg-red-400 hover:cursor-pointer rounded transition-colors"
						title="Delete tag"
					>
						<IoTrash className="h-4 w-4" />
					</button>
				)}
			</div>

			<AnimatePresence>
				{/* Inline children (wide screens) */}
				{showChildren && !useOverlay && (
					<motion.div
						exit={{
							transformOrigin: "top",
							scaleY: ["100%", 0],
							height: ["auto", 0],
							width: ["100%", 0],
							opacity: [1, 0],
							transition: { duration: 0.2, ease: "easeOut" },
						}}
						animate={{
							scaleY: ["0%", "100%"],
							height: [0, "auto"],
							width: [0, "100%"],
							transformOrigin: "top",
							opacity: [0, 1],
							transition: { duration: 0.25, ease: "easeIn" },
						}}
					>
						<div className="flex">
							<div
								className={`min-h-full rounded w-8 my-1 ${bgColorRef[zIndex] ?? ""}`}
							/>
							<div
								className={`ml-2 border-l border-b rounded-bl-xl px-2 max-w-full overflow-x-scroll ${borderColorRef[zIndex] ?? ""}`}
							>
								{children}
								{addForm}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Bottom-sheet overlay (narrow screens, stacked drill-down) */}
			<AnimatePresence
				onExitComplete={() => {
					// Reset fullscreen when the sheet has fully exited
					setIsFullscreen(false);
				}}
			>
				{useOverlay && (
					<>
						{/* Backdrop */}
						<motion.div
							key="backdrop"
							className="fixed inset-0 bg-black/50 backdrop-blur-sm"
							style={{ zIndex: backdropZ }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.25, ease: "easeOut" }}
							onClick={() => setShowChildren(false)}
						/>

						{/* Sheet */}
						<motion.div
							key="sheet"
							className="fixed bottom-0 left-0 right-0 flex flex-col bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden"
							style={{ zIndex: sheetZ }}
							// Enter / exit
							initial={{ y: "100%" }}
							animate={{
								y: 0,
								height: isFullscreen ? "100dvh" : "80vh",
								borderRadius: isFullscreen
									? "0px"
									: "16px 16px 0 0",
							}}
							exit={{
								y: "100%",
								scale: [1, 0],
								filter: ["blur(0px)", "blur(100px)"],
								opacity: [1, 0],
							}}
							transition={{
								y: {
									type: "spring",
									stiffness: 400,
									damping: 40,
									mass: 1,
								},
								height: {
									type: "spring",
									stiffness: 350,
									damping: 35,
								},
								borderRadius: {
									duration: 0.25,
									ease: "easeInOut",
								},
							}}
							// Drag — only initiated from the handle below
							drag="y"
							dragListener={false}
							dragControls={dragControls}
							dragConstraints={{ top: 0, bottom: 0 }}
							dragElastic={{ top: 0.15, bottom: 0.4 }}
							dragMomentum={false}
							onDragEnd={handleDragEnd}
						>
							{/* Sheet header */}
							<div
								className={`${bgColorRef[zIndex] ?? "bg-white dark:bg-neutral-900"} flex flex-col cursor-grab active:cursor-grabbing touch-none`}
								onPointerDown={(e) => dragControls.start(e)}
							>
								{/* Drag handle pill */}
								<div className="flex justify-center pt-3 pb-4 shrink-0 touch-none select-none">
									<div
										className={
											"w-1/5 h-1 rounded-full " +
											(bg2ColorRef[zIndex] ??
												"bg-neutral-300 dark:bg-neutral-600")
										}
									/>
								</div>
								{/* Actual Header */}
								<div
									className={
										"flex items-center gap-2 px-4 pb-3 border-b shrink-0 " +
										(border2ColorRef[zIndex] ??
											"dark:border-neutral-700 border-neutral-200")
									}
								>
									<div className="flex items-center justify-center p-1 dark:text-neutral-200 text-neutral-800 shrink-0">
										{getIcon(tag.type)}
									</div>
									<Display
										disabled={viewOnly}
										className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate flex-1"
										defaultValue={tag.name}
										validate={() => true}
										onSuccess={(newName) => {
											updateTag({
												...tag,
												name: newName,
											});
											return newName;
										}}
									/>
									<span
										className={`text-sm
											${textColorRef[zIndex] ?? "text-neutral-400 dark:text-neutral-500"}
											${bg2ColorRef[zIndex] ?? "bg-neutral-200 dark:bg-neutral-500"}
											${border2ColorRef[zIndex] ?? "border-neutral-400 dark:border-neutral-600"} border
											py-0.5 px-2 rounded-full shrink-0`}
									>
										{TYPE_LABELS[
											tag.type as TreeTagContainerType
										] ?? tag.type}
									</span>
									<PathTransversalButton
										title={
											isFullscreen
												? "Exit fullscreen"
												: "Close"
										}
										onClick={() => {
											isFullscreen
												? setIsFullscreen(false)
												: setShowChildren(false);
										}}
										onSelectPath={(_selectedTag, index) => {
											const fullPath = [
												...overlayPath,
												tag,
											];
											// If the user selected the current tag (last in path), just close fullscreen or do nothing
											if (index === fullPath.length - 1) {
												if (isFullscreen)
													setIsFullscreen(false);
												return;
											}
											// Selected an ancestor — close all sheets deeper than the selected index
											closeSignal.closeToDepth(index);
										}}
										path={[...overlayPath, tag]}
									/>
								</div>
							</div>

							{/* Scrollable content.
							    Provide depth + 1 so any nested foldable body that the
							    user opens will stack its own sheet above this one. */}
							<OverlayDepthContext value={[...overlayPath, tag]}>
								<div className="overflow-y-auto flex-1 px-3 py-2">
									{children}
									{addForm}
								</div>
							</OverlayDepthContext>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
