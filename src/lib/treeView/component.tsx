import type { ReactNode } from "react";
import {
    IoCalculator,
    IoCodeSlash,
    IoGrid,
    IoListCircle,
    IoServer,
    IoText,
    IoToggle
} from "react-icons/io5";
import { TbDecimal, TbNumber123, TbQuestionMark } from "react-icons/tb";
import {
    TreeTagContainerType,
    TreeTagValueType,
    type TreeTagType
} from "./types";

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
	0: "bg-neutral-200 dark:bg-neutral-800",
	1: "bg-red-100 dark:bg-red-950",
	2: "bg-blue-100 dark:bg-blue-950",
	3: "bg-green-100 dark:bg-green-950",
	4: "bg-yellow-100 dark:bg-yellow-950",
	5: "bg-purple-100 dark:bg-purple-950",
};

export const borderColorRef: Record<number, string> = {
	1: "border-red-400 dark:border-red-500",
	2: "border-blue-400 dark:border-blue-500",
	3: "border-green-400 dark:border-green-500",
	4: "border-yellow-400 dark:border-yellow-500",
	5: "border-purple-400 dark:border-purple-500",
};
