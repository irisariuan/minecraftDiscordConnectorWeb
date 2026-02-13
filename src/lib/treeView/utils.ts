import {
	type TreeTag,
	type TreeTagType,
	TreeTagContainerType,
	TreeTagValueType,
} from "./types";

export function expandable(
	tag: TreeTag<TreeTagType>,
): tag is TreeTag<TreeTagContainerType> {
	return (Object.values(TreeTagContainerType) as TreeTagType[]).includes(
		tag.type,
	);
}
export function getRelativeTagType(
	tagType: TreeTagContainerType,
): TreeTagType | null {
	switch (tagType) {
		case TreeTagContainerType.ByteArray:
			return TreeTagValueType.Byte;
		case TreeTagContainerType.List:
			return null;
		case TreeTagContainerType.Compound:
			return null;
		case TreeTagContainerType.IntArray:
			return TreeTagValueType.Int;
		case TreeTagContainerType.LongIntArray:
			return TreeTagValueType.LongInt;
		default:
			return null;
	}
}

export function isContainerType(
	tag: TreeTag<TreeTagType>,
): tag is TreeTag<TreeTagContainerType> {
	return (Object.values(TreeTagContainerType) as TreeTagType[]).includes(
		tag.type,
	);
}

export function isValue(
	tag: TreeTag<TreeTagType>,
): tag is TreeTag<TreeTagValueType> {
	return (Object.values(TreeTagValueType) as TreeTagType[]).includes(
		tag.type,
	);
}

export const numericTypeArray = [
	TreeTagValueType.Int,
	TreeTagValueType.LongInt,
	TreeTagValueType.ShortInt,
	TreeTagValueType.Float,
	TreeTagValueType.DoubleFloat,
] as const;
export type NumericTypes =
	(typeof numericTypeArray)[keyof typeof numericTypeArray & TreeTagType];

export function withinRange(value: number, type: NumericTypes) {
	if (Number.isNaN(value)) return false;
	switch (type) {
		// java 32 bit signed int
		case TreeTagValueType.Int:
			return value >= -2147483648 && value <= 2147483647;
		// java 64 bit signed int
		case TreeTagValueType.LongInt:
			return (
				value >= -9_223_372_036_854_775_808n &&
				value <= 9_223_372_036_854_775_807n
			);
		// java 16 bit signed int
		case TreeTagValueType.ShortInt:
			return value >= -32768 && value <= 32767;
		// java 32 bit float
		case TreeTagValueType.Float:
			return value >= -3.4028235e38 && value <= 3.4028235e38;
		// java 64 bit double
		case TreeTagValueType.DoubleFloat:
			return value >= -Number.MAX_VALUE && value <= Number.MAX_VALUE;
		default:
			return false;
	}
}
