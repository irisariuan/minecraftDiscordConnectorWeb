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

// Extensions we can safely display as text in Monaco
export const TEXT_EXTENSIONS = new Set([
	"txt",
	"json",
	"js",
	"jsx",
	"ts",
	"tsx",
	"py",
	"java",
	"rb",
	"go",
	"rs",
	"php",
	"swift",
	"kt",
	"kts",
	"cs",
	"cpp",
	"cc",
	"cxx",
	"c",
	"h",
	"hpp",
	"html",
	"htm",
	"css",
	"scss",
	"sass",
	"md",
	"markdown",
	"yaml",
	"yml",
	"xml",
	"sh",
	"bash",
	"zsh",
	"fish",
	"ps1",
	"bat",
	"cmd",
	"lua",
	"sql",
	"toml",
	"ini",
	"cfg",
	"conf",
	"env",
	"log",
	"csv",
	"tsv",
	"properties",
]);
