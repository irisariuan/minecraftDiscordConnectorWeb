import { API_BASE_URL } from "astro:env/client";
import { parse, stringify } from "./jsonBigInt";
import type { TreeTag, TreeTagContainerType } from "./treeView/types";

export async function uploadFiles(id: string, file: File) {
	const formData = new FormData();
	formData.append("upload", file);
	const res = await fetch(API_BASE_URL + "/api/upload/" + id, {
		method: "POST",
		body: formData,
		mode: "cors",
	});
	if (res.ok) {
		return { success: true };
	} else {
		return { success: false, reason: await res.text() };
	}
}

export async function fetchFile(id: string) {
	const res = await fetch(API_BASE_URL + "/api/file/" + id, {
		mode: "cors",
	});
	if (res.ok) {
		const data: Blob = await res.blob();
		return { success: true, data };
	} else {
		return { success: false, reason: await res.text() };
	}
}

export async function fetchEditingFile(
	id: string,
	isNbt: true,
	isBedrock: boolean,
): Promise<TreeTag<TreeTagContainerType> | null>;
export async function fetchEditingFile(
	id: string,
	isNbt: false,
	isBedrock: boolean,
): Promise<string | null>;
export async function fetchEditingFile(
	id: string,
	isNbt: boolean,
	isBedrock: boolean,
): Promise<TreeTag<TreeTagContainerType> | string | null> {
	const res = await fetch(API_BASE_URL + "/api/file/" + id, {
		method: "POST",
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ action: "fetch", parseNbt: isNbt, isBedrock }),
	});
	if (!res.ok) return null;
	if (isNbt) {
		const data = parse(await res.text()) as Record<string, unknown>;
		if (!data.parsed) return null;
		return data.parsed as TreeTag<TreeTagContainerType>;
	}
	return await res.text();
}

/**
 * Fetches the NBT tree for editing, handling both plain-edit and diff-edit
 * token types. Returns the editable tree plus the original tree when in diff
 * mode.
 */
export async function fetchEditingNbtFile(
	id: string,
	isBedrock: boolean,
): Promise<{
	tag: TreeTag<TreeTagContainerType>;
	original?: TreeTag<TreeTagContainerType>;
} | null> {
	const res = await fetch(API_BASE_URL + "/api/file/" + id, {
		method: "POST",
		mode: "cors",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "fetch", parseNbt: true, isBedrock }),
	});
	if (!res.ok) return null;

	const data = parse(await res.text()) as Record<string, unknown>;

	// Diff token response: { edited: TreeTag, raw: TreeTag, rawBinary: string }
	if (data.edited) {
		return {
			tag: data.edited as TreeTag<TreeTagContainerType>,
			original: data.raw as TreeTag<TreeTagContainerType>,
		};
	}

	// Non-diff token response: { parsed: TreeTag, raw: hexString }
	if (data.parsed) {
		return { tag: data.parsed as TreeTag<TreeTagContainerType> };
	}

	return null;
}

export async function submitEdit(
	id: string,
	content: string,
	options?: {
		isNbt?: boolean;
		isBedrock?: boolean;
		compressionMethod?: "gzip" | "zlib";
	},
): Promise<boolean> {
	const body = options?.isNbt
		? stringify({
				action: "edit",
				editedContent: content,
				isNbt: true,
				isBedrock: options.isBedrock ?? false,
				...(options.compressionMethod
					? { compressionMethod: options.compressionMethod }
					: {}),
			})
		: stringify({ action: "edit", editedContent: content });

	const res = await fetch(API_BASE_URL + "/api/file/" + id, {
		method: "POST",
		mode: "cors",
		headers: { "Content-Type": "application/json" },
		body,
	});
	return res.ok;
}

export async function fetchViewFile(
	id: string,
	isNbt: boolean,
	isBedrock: boolean,
): Promise<{
	success: boolean;
	content?: string;
	error?: string;
}> {
	const url = new URL(API_BASE_URL + "/api/file/" + id);
	// The server reads "parseNbt", not "isNbt"
	url.searchParams.append("parseNbt", isNbt ? "true" : "false");
	url.searchParams.append("isBedrock", isBedrock ? "true" : "false");
	const res = await fetch(url, { mode: "cors" });
	if (!res.ok) {
		if (res.status === 401) {
			return { success: false, error: "Invalid or expired token" };
		} else if (res.status === 404) {
			return { success: false, error: "File not found" };
		} else {
			return { success: false, error: "Error loading file" };
		}
	}
	const data = await res.json();
	return { success: true, content: data.content };
}

/**
 * Fetches a read-only parsed NBT tree for a ViewToken.
 * Returns the parsed tree and original filename.
 */
export async function fetchViewNbtFile(
	id: string,
	isBedrock: boolean,
): Promise<{
	tag: TreeTag<TreeTagContainerType>;
	filename: string;
} | null> {
	const url = new URL(API_BASE_URL + "/api/file/" + id);
	url.searchParams.append("parseNbt", "true");
	url.searchParams.append("isBedrock", isBedrock ? "true" : "false");
	const res = await fetch(url, { mode: "cors" });
	if (!res.ok) return null;

	// Server uses json-bigint stringify for NBT responses
	const data = parse(await res.text()) as Record<string, unknown>;
	if (!data.content || !data.filename) return null;
	return {
		tag: data.content as TreeTag<TreeTagContainerType>,
		filename: data.filename as string,
	};
}

export async function disposeFile(id: string): Promise<boolean> {
	const res = await fetch(
		API_BASE_URL + "/api/token/" + id + "?dispose=true",
		{
			method: "DELETE",
			mode: "cors",
		},
	);
	if (!res.ok) return false;
	const {
		success,
	}: { success: boolean; message: string; wasActive: boolean } =
		await res.json();
	return success;
}
