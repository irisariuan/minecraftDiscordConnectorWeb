import { useState, type ReactNode } from "react";
import {
	IoCalculator,
	IoCaretDown,
	IoCaretUp,
	IoCodeSlash,
	IoGrid,
	IoListCircle,
	IoServer,
	IoText,
	IoToggle,
} from "react-icons/io5";
import { TbDecimal, TbNumber123, TbQuestionMark } from "react-icons/tb";
import {
	TreeTagContainerType,
	TreeTagValueType,
	type TreeTag,
	type TreeTagType,
} from "./TreeViewBody";
import EditableDisplay from "./EditableDisplay";

export function getIcon(tagType: TreeTagType, className?: string): ReactNode {
	switch (tagType) {
		case TreeTagContainerType.ByteArray:
			return <IoServer className={className} />;
		case TreeTagContainerType.Compound:
			return <IoGrid className={className} />;
		case TreeTagContainerType.IntArray:
		case TreeTagContainerType.LongIntArray:
			return <IoCalculator className={className} />;
		case TreeTagContainerType.List:
			return <IoListCircle className={className} />;
		case TreeTagValueType.Byte:
			return <IoToggle className={className} />;
		case TreeTagValueType.String:
			return <IoText className={className} />;
		case TreeTagValueType.ShortInt:
		case TreeTagValueType.LongInt:
		case TreeTagValueType.Int:
			return <TbNumber123 className={className} />;
		case TreeTagValueType.Float:
		case TreeTagValueType.DoubleFloat:
			return <TbDecimal className={className} />;
		case TreeTagValueType.CompoundEnd:
			return <IoCodeSlash className={className} />;
		default:
			return <TbQuestionMark className={className} />;
	}
}

export const bgColorRef: Record<number, string> = {
	0: "bg-neutral-800",
	1: "bg-red-950",
	2: "bg-blue-950",
	3: "bg-green-950",
	4: "bg-yellow-950",
	5: "bg-purple-950",
};

export const borderColorRef: Record<number, string> = {
	1: "border-red-500",
	2: "border-blue-500",
	3: "border-green-500",
	4: "border-yellow-500",
	5: "border-purple-500",
};

export default function TreeViewTagFoldableBody({
	children,
	tag,
	zIndex,
	updateTag,
	noTitle,
}: {
	tag: TreeTag<TreeTagType>;
	children?: ReactNode;
	zIndex: number;
	updateTag: (tag: TreeTag<TreeTagType>) => void;
	noTitle?: boolean;
}) {
	const [showChildren, setShowChildren] = useState(true);
	return (
		<div title={tag.type} className="my-1">
			<div className="flex items-center gap-1">
				<div className="flex items-center justify-center p-1 bg-neutral-800 rounded text-neutral-500">
					{getIcon(tag.type)}
				</div>
				{!noTitle && (
					<EditableDisplay
						validate={() => true}
						onSuccess={(s) => {
							updateTag({ ...tag, name: s });
							return s;
						}}
						defaultValue={tag.name}
					/>
				)}
				<button
					className="hover:cursor-pointer"
					onClick={() => {
						setShowChildren((prev) => !prev);
					}}
				>
					{children &&
						(showChildren ? <IoCaretUp /> : <IoCaretDown />)}
				</button>
			</div>
			{children && showChildren && (
				<div className="flex">
					<div
						className={`min-h-full rounded w-8 my-1 ${bgColorRef[zIndex] ?? ""}`}
					/>
					<div
						className={`ml-2 border-l border-b rounded-bl-xl px-2 py-1 max-w-full overflow-x-scroll ${borderColorRef[zIndex] ?? ""}`}
					>
						{children}
					</div>
				</div>
			)}
		</div>
	);
}
