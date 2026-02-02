export enum EditorMode {
	Edit = "edit",
	View = "view",
	EditDiff = "editDiff",
	ViewDiff = "viewDiff",
	FileLoading = "fileLoading",
	FileUploading = "fileUploading",
	FileUploadFailed = "fileUploadFailed",
}

export function editable(mode: EditorMode): boolean {
	return mode === EditorMode.Edit || mode === EditorMode.EditDiff;
}
export function isViewOnly(mode: EditorMode): boolean {
	return mode === EditorMode.View || mode === EditorMode.ViewDiff;
}
export function displayable(mode: EditorMode): boolean {
	return editable(mode) || isViewOnly(mode);
}
export function isDiffMode(mode: EditorMode): boolean {
	return mode === EditorMode.EditDiff || mode === EditorMode.ViewDiff;
}
