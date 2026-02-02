export async function uploadFiles(id: string, file: File) {
	const formData = new FormData();
	formData.append("upload", file);
	const res = await fetch("/api/upload/" + id, {
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
	const res = await fetch("/api/file/" + id, {
		mode: "cors",
	});
	if (res.ok) {
		const data: Blob = await res.blob();
		return { success: true, data };
	} else {
		return { success: false, reason: await res.text() };
	}
}

export async function fetchEditingFile(id: string) {
	const res = await fetch("/api/edit/" + id, {
		method: "POST",
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ action: "fetch" }),
	});
	if (!res.ok) return null;
	return await res.text();
}

export async function submitEdit(
	id: string,
	content: string,
): Promise<boolean> {
	const res = await fetch("/api/edit/" + id, {
		method: "POST",
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ action: "edit", editedContent: content }),
	});
	return res.ok;
}