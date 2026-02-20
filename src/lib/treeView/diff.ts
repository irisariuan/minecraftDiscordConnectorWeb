import {
	TreeTagContainerType,
	TreeTagTypeEnums,
	type TreeTag,
	type TreeTagType,
} from "./types";

export type DiffStatus = "added" | "modified" | "deleted";

export interface DiffMaps {
	/** Status annotations keyed by node reference from the *original* tree */
	originalMap: Map<TreeTag<TreeTagType>, DiffStatus>;
	/** Status annotations keyed by node reference from the *edited* tree */
	editedMap: Map<TreeTag<TreeTagType>, DiffStatus>;
}

function isTreeTag(v: unknown): v is TreeTag<TreeTagType> {
	return (
		typeof v === "object" &&
		v !== null &&
		"type" in v &&
		typeof v.type === "string" &&
		TreeTagTypeEnums.includes(v.type)
	);
}

/**
 * Recursively mark a node and ALL of its descendants with the given status.
 */
function markAll(
	tag: TreeTag<TreeTagType>,
	status: DiffStatus,
	map: Map<TreeTag<TreeTagType>, DiffStatus>,
): void {
	map.set(tag, status);
	if (!Array.isArray(tag.value)) return;
	for (const v of tag.value) {
		if (isTreeTag(v)) {
			markAll(v, status, map);
		}
	}
}

/**
 * Return only the TreeTag children of a container node.
 */
function getTagChildren(tag: TreeTag<TreeTagType>): TreeTag<TreeTagType>[] {
	if (!Array.isArray(tag.value)) return [];
	return tag.value.filter(isTreeTag);
}

/**
 * Shallow-compare two primitive arrays (string | number).
 */
function primitiveArraysEqual(
	a: (string | number)[],
	b: (string | number)[],
): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

function diffNodes(
	orig: TreeTag<TreeTagType>,
	edit: TreeTag<TreeTagType>,
	originalMap: Map<TreeTag<TreeTagType>, DiffStatus>,
	editedMap: Map<TreeTag<TreeTagType>, DiffStatus>,
): void {
	// Completely different types -> treat as full replacement
	if (orig.type !== edit.type) {
		markAll(orig, "deleted", originalMap);
		markAll(edit, "added", editedMap);
		return;
	}

	const type = orig.type;

	// Compound
	if (type === TreeTagContainerType.Compound) {
		const origChildren = getTagChildren(orig);
		const editChildren = getTagChildren(edit);

		const origByName = new Map<string, TreeTag<TreeTagType>>(
			origChildren.map((c) => [c.name, c]),
		);
		const editByName = new Map<string, TreeTag<TreeTagType>>(
			editChildren.map((c) => [c.name, c]),
		);

		// Walk original -> find deleted + recurse into shared
		for (const child of origChildren) {
			const counterpart = editByName.get(child.name);
			if (!counterpart) {
				markAll(child, "deleted", originalMap);
			} else {
				diffNodes(child, counterpart, originalMap, editedMap);
			}
		}

		// Walk edited -> find added
		for (const child of editChildren) {
			if (!origByName.has(child.name)) {
				markAll(child, "added", editedMap);
			}
			// shared nodes already handled above
		}
		return;
	}

	// List (children are TreeTag objects)
	if (type === TreeTagContainerType.List) {
		const origVals = (orig.value ?? []) as (
			| string
			| number
			| TreeTag<TreeTagType>
		)[];
		const editVals = (edit.value ?? []) as (
			| string
			| number
			| TreeTag<TreeTagType>
		)[];

		const maxLen = Math.max(origVals.length, editVals.length);
		for (let i = 0; i < maxLen; i++) {
			const ov = origVals[i];
			const ev = editVals[i];

			if (ov === undefined) {
				// extra item in edited → added
				if (isTreeTag(ev)) markAll(ev, "added", editedMap);
			} else if (ev === undefined) {
				// item removed in edited → deleted
				if (isTreeTag(ov)) markAll(ov, "deleted", originalMap);
			} else if (isTreeTag(ov) && isTreeTag(ev)) {
				diffNodes(ov, ev, originalMap, editedMap);
			}
			// primitive list items: skip individual highlighting for now
		}
		return;
	}

	// Primitive arrays (ByteArray / IntArray / LongIntArray)
	if (
		type === TreeTagContainerType.ByteArray ||
		type === TreeTagContainerType.IntArray ||
		type === TreeTagContainerType.LongIntArray
	) {
		const origPrims = (orig.value ?? []) as (string | number)[];
		const editPrims = (edit.value ?? []) as (string | number)[];
		if (!primitiveArraysEqual(origPrims, editPrims)) {
			// Mark the container itself as modified (can't easily highlight individual primitives)
			originalMap.set(orig, "modified");
			editedMap.set(edit, "modified");
		}
		return;
	}

	// Primitive value nodes, direct compare their values
	if (orig.value !== edit.value) {
		originalMap.set(orig, "modified");
		editedMap.set(edit, "modified");
	}
}

/**
 * Compare two trees and produce annotation maps that describe how each node
 * changed.
 *
 * - `originalMap`: nodes from the *original* tree that are `deleted`
 * - `editedMap`:  nodes from the *edited* tree that are `added` or `modified`
 *
 * Nodes that are identical appear in neither map.
 */
export function computeDiffMaps(
	original: TreeTag<TreeTagType>,
	edited: TreeTag<TreeTagType>,
): DiffMaps {
	const originalMap = new Map<TreeTag<TreeTagType>, DiffStatus>();
	const editedMap = new Map<TreeTag<TreeTagType>, DiffStatus>();
	diffNodes(original, edited, originalMap, editedMap);
	return { originalMap, editedMap };
}
export const diffBgClass: Record<DiffStatus, string> = {
	added: "bg-green-100 dark:bg-green-950 p-1 rounded-lg",
	modified: "bg-orange-100 dark:bg-orange-950 p-1 rounded-lg",
	deleted: "bg-red-100 dark:bg-red-950 p-1 rounded-lg",
};