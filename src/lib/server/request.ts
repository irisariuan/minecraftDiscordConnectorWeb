import { API_BASE_URL } from "astro:env/client";

export async function serverSideVerifyId(id: string) {
	if (!id)
		return {
			valid: false,
			uploaded: false,
			edited: false,
		};
	const res = await fetch(API_BASE_URL + "/api/verify/" + id, {
		mode: "cors",
	});
	if (res.ok) {
		const data: { valid: boolean; uploaded: boolean; edited: boolean } =
			await res.json();
		return data;
	}
	return { valid: false, uploaded: false, edited: false };
}

export async function serverSideGetEditFileMetadata(id: string) {
	const res = await fetch(API_BASE_URL + "/api/edit/" + id, {
		method: "POST",
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ action: "metadata" }),
	});
	if (!res.ok) return null;
	const data: EditFileMetadata = await res.json();
	return data;
}

export interface EditFileMetadata {
	filename: string;
	extension: string;
	isDiff: boolean;
	isForce: boolean;
}

export async function serverSideGetViewFileMetadata(id: string) {
	const res = await fetch(API_BASE_URL + "/api/view/" + id, {
		method: "GET",
		mode: "cors",
	});
	if (!res.ok) return null;
	const data: ViewFileMetadata = await res.json();
	return data;
}

export interface ViewFileMetadata {
	filename: string;
	content: string;
	readonly: boolean;
}
