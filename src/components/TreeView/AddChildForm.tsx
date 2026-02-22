import { useState } from "react";
import { IoAdd, IoClose } from "react-icons/io5";
import {
	TreeTagContainerType,
	TreeTagValueType,
	type TreeTag,
	type TreeTagType,
} from "../../lib/treeView/types";
import { getIcon } from "../../lib/treeView/component";

export type AddableType = Exclude<TreeTagType, TreeTagValueType.CompoundEnd>;

export const ADDABLE_TYPES: AddableType[] = [
	TreeTagValueType.Byte,
	TreeTagValueType.ShortInt,
	TreeTagValueType.Int,
	TreeTagValueType.LongInt,
	TreeTagValueType.Float,
	TreeTagValueType.DoubleFloat,
	TreeTagValueType.String,
	TreeTagContainerType.ByteArray,
	TreeTagContainerType.IntArray,
	TreeTagContainerType.LongIntArray,
	TreeTagContainerType.List,
	TreeTagContainerType.Compound,
];
export function isAddableType(type: TreeTagType): type is AddableType {
	return ADDABLE_TYPES.includes(type as AddableType);
}

export const TYPE_LABELS: Record<AddableType, string> = {
	[TreeTagValueType.Byte]: "Byte",
	[TreeTagValueType.ShortInt]: "Short",
	[TreeTagValueType.Int]: "Int",
	[TreeTagValueType.LongInt]: "Long",
	[TreeTagValueType.Float]: "Float",
	[TreeTagValueType.DoubleFloat]: "Double",
	[TreeTagValueType.String]: "String",
	[TreeTagContainerType.ByteArray]: "Byte[]",
	[TreeTagContainerType.IntArray]: "Int[]",
	[TreeTagContainerType.LongIntArray]: "Long[]",
	[TreeTagContainerType.List]: "List",
	[TreeTagContainerType.Compound]: "Compound",
};

export function createDefaultTag(
	type: AddableType,
	name: string,
): TreeTag<TreeTagType> {
	switch (type) {
		case TreeTagValueType.String:
			return { type, name, value: "" };
		case TreeTagValueType.Byte:
		case TreeTagValueType.ShortInt:
		case TreeTagValueType.Int:
		case TreeTagValueType.LongInt:
		case TreeTagValueType.Float:
		case TreeTagValueType.DoubleFloat:
			return { type, name, value: 0 };
		case TreeTagContainerType.ByteArray:
		case TreeTagContainerType.IntArray:
		case TreeTagContainerType.LongIntArray:
		case TreeTagContainerType.List:
		case TreeTagContainerType.Compound:
			return {
				type,
				name,
				value: [],
			} as unknown as TreeTag<TreeTagType>;
	}
}

const PRIMITIVE_ARRAY_TYPES = new Set<TreeTagContainerType>([
	TreeTagContainerType.ByteArray,
	TreeTagContainerType.IntArray,
	TreeTagContainerType.LongIntArray,
]);

export default function AddChildForm({
	containerType,
	onAdd,
}: {
	containerType: TreeTagContainerType;
	onAdd: (item: string | number | TreeTag<TreeTagType>) => void;
}) {
	const [open, setOpen] = useState(false);
	const [selectedType, setSelectedType] = useState<AddableType>(
		TreeTagValueType.String,
	);
	const [name, setName] = useState("");

	const isPrimitiveArray = PRIMITIVE_ARRAY_TYPES.has(containerType);
	const needsName = containerType === TreeTagContainerType.Compound;
	const canConfirm = !needsName || name.trim().length > 0;

	// Primitive arrays: a single inline "+ Add item" button, no form needed
	if (isPrimitiveArray) {
		return (
			<button
				className="flex items-center gap-1 p-2 text-sm hover:cursor-pointer text-neutral-500 dark:text-neutral-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
				onClick={() => onAdd(0)}
			>
				<IoAdd size={12} />
				Add item
			</button>
		);
	}

	function handleConfirm() {
		if (!canConfirm) return;
		onAdd(createDefaultTag(selectedType, name.trim()));
		setName("");
		setOpen(false);
	}

	function handleCancel() {
		setOpen(false);
		setName("");
	}

	if (!open) {
		return (
			<button
				className="flex items-center gap-1 p-2 text-sm hover:cursor-pointer text-neutral-500 dark:text-neutral-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
				onClick={() => setOpen(true)}
			>
				<IoAdd className="w-4 h-4" />
				Add child
			</button>
		);
	}

	return (
		<div className="sticky bottom-0 left-0 m-1 p-2 rounded bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-2xl flex flex-col gap-2">
			{/* Type selector */}
			<div className="flex flex-wrap gap-1">
				{ADDABLE_TYPES.map((type) => (
					<button
						key={type}
						title={TYPE_LABELS[type]}
						className={`flex items-center gap-1 py-1 px-2 rounded text-sm transition-colors ${
							selectedType === type
								? "bg-blue-500 dark:bg-blue-600 text-white"
								: "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:cursor-pointer"
						}`}
						onClick={() => setSelectedType(type)}
					>
						{getIcon(type)}
						<span className="ml-1">{TYPE_LABELS[type]}</span>
					</button>
				))}
			</div>

			{/* Name input — Compound children must have a unique name */}
			{needsName && (
				<input
					autoFocus
					type="text"
					placeholder="Tag name…"
					value={name}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleConfirm();
						if (e.key === "Escape") handleCancel();
					}}
					className="px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-400 dark:focus:border-blue-500 outline-0"
				/>
			)}

			{/* Actions */}
			<div className="flex gap-1 w-full">
				<button
					disabled={!canConfirm}
					onClick={handleConfirm}
					title="Add Tag"
					className="flex flex-1 justify-center items-center gap-1 p-2 rounded-xl bg-green-500 text-green-100 hover:bg-green-300 hover:text-green-500 dark:hover:bg-green-800 dark:hover:text-green-400 not-disabled:hover:cursor-pointer disabled:opacity-40 transition-colors"
				>
					<IoAdd className="h-4 w-4" />
					Add
				</button>
				<button
					onClick={handleCancel}
					title="Cancel"
					className="flex flex-1 justify-center items-center gap-1 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 not-disabled:hover:cursor-pointer transition-colors"
				>
					<IoClose className="h-4 w-4" />
					Cancel
				</button>
			</div>
		</div>
	);
}
