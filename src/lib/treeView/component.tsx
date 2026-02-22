import type { ReactNode } from "react";
import {
	IoCalculator,
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
	type TreeTagType,
} from "./types";

export function getIcon(
	tagType: TreeTagType,
	className?: string,
	size?: number,
): ReactNode {
	switch (tagType) {
		case TreeTagContainerType.ByteArray:
			return <IoServer className={className} size={size} />;
		case TreeTagContainerType.Compound:
			return <IoGrid className={className} size={size} />;
		case TreeTagContainerType.IntArray:
		case TreeTagContainerType.LongIntArray:
			return <IoCalculator className={className} size={size} />;
		case TreeTagContainerType.List:
			return <IoListCircle className={className} size={size} />;
		case TreeTagValueType.Byte:
			return <IoToggle className={className} size={size} />;
		case TreeTagValueType.String:
			return <IoText className={className} size={size} />;
		case TreeTagValueType.ShortInt:
		case TreeTagValueType.LongInt:
		case TreeTagValueType.Int:
			return <TbNumber123 className={className} size={size} />;
		case TreeTagValueType.Float:
		case TreeTagValueType.DoubleFloat:
			return <TbDecimal className={className} size={size} />;
		case TreeTagValueType.CompoundEnd:
			return <IoCodeSlash className={className} size={size} />;
		default: {
			console.error("Unknown tag type:", tagType);
			return <TbQuestionMark className={className} size={size} />;
		}
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
export const bg2ColorRef: Record<number, string> = {
	0: "bg-neutral-300 dark:bg-neutral-700",
	1: "bg-red-200 dark:bg-red-900",
	2: "bg-blue-200 dark:bg-blue-900",
	3: "bg-green-200 dark:bg-green-900",
	4: "bg-yellow-200 dark:bg-yellow-900",
	5: "bg-purple-200 dark:bg-purple-900",
};

export const textColorRef: Record<number, string> = {
	0: "text-neutral-600 dark:text-neutral-500",
	1: "text-red-600 dark:text-red-400",
	2: "text-blue-600 dark:text-blue-400",
	3: "text-green-600 dark:text-green-400",
	4: "text-yellow-600 dark:text-yellow-400",
	5: "text-purple-600 dark:text-purple-400",
};

export const borderColorRef: Record<number, string> = {
	1: "border-red-400 dark:border-red-500",
	2: "border-blue-400 dark:border-blue-500",
	3: "border-green-400 dark:border-green-500",
	4: "border-yellow-400 dark:border-yellow-500",
	5: "border-purple-400 dark:border-purple-500",
};
export const border2ColorRef: Record<number, string> = {
	1: "border-red-300 dark:border-red-900",
	2: "border-blue-300 dark:border-blue-900",
	3: "border-green-300 dark:border-green-900",
	4: "border-yellow-300 dark:border-yellow-900",
	5: "border-purple-300 dark:border-purple-900",
};