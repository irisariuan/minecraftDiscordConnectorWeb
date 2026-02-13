import { API_BASE_URL } from "astro:env/client";
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
	const res = await fetch(API_BASE_URL + "/api/edit/" + id, {
		method: "POST",
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ action: "fetch", parseNbt: isNbt, isBedrock }),
	});
	if (!res.ok) return null;
	if (isNbt) {
		const data = await res.json();
		if (!data.parsed) return null;
		return data.parsed as TreeTag<TreeTagContainerType>;
	}
	return await res.text();
}

export async function submitEdit(
	id: string,
	content: string,
): Promise<boolean> {
	const res = await fetch(API_BASE_URL + "/api/edit/" + id, {
		method: "POST",
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ action: "edit", editedContent: content }),
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
	const url = new URL(API_BASE_URL + "/api/view/" + id);
	url.searchParams.append("isNbt", isNbt ? "true" : "false");
	url.searchParams.append("isBedrock", isBedrock ? "true" : "false");
	const res = await fetch(url, {
		mode: "cors",
	});
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
