import { useState, type Dispatch, type SetStateAction } from "react";
import TreeViewTag from "./TreeViewTag";

export interface TreeTag<Type extends TreeTagType> {
	name: string;
	type: Type;
	value: Type extends TreeTagContainerType
		? (string | number | TreeTag<TreeTagType>)[]
		: undefined | string | number;
}

export type TreeTagType = TreeTagValueType | TreeTagContainerType;
export enum TreeTagValueType {
	Byte = "byte",
	ShortInt = "short",
	Int = "int",
	LongInt = "long",
	Float = "float",
	DoubleFloat = "double",
	String = "string",
	CompoundEnd = "end",
}

export enum TreeTagContainerType {
	ByteArray = "byteArray",
	IntArray = "intArray",
	LongIntArray = "longArray",
	List = "list",
	Compound = "compound",
}

export default function TreeViewBody({ data }: { data: TreeTag<TreeTagType> }) {
	const [tag, setTag] = useState(data);
	return (
		<div className="flex-1 bg-white dark:bg-black text-black dark:text-white p-2 w-full">
			<TreeViewTag
				zIndex={0}
				tag={tag}
				updateTag={(newTag) => {
					setTag(newTag);
					console.log(newTag);
				}}
			/>
		</div>
	);
}
