import { Editor } from "@monaco-editor/react";
import { useRef, useState } from "react";
import FileCard from "./FileCard";
import { decideLanguageFromExtension } from "../lib/language";
import UploadNavBar from "./UploadNavBar";
import UploadingState from "./states/UploadingState";
import UploadedState from "./states/UploadedState";
import UploadFailedState from "./states/UploadFailedState";
import { uploadFiles } from "../lib/request";
import { TEXT_EXTENSIONS } from "../lib/editor";

function getExtension(name: string): string | null {
	return name.split(".").pop()?.toLowerCase() ?? null;
}

function isTextExtension(name: string): boolean {
	const ext = getExtension(name);
	if (!ext) return false;
	return TEXT_EXTENSIONS.has(ext);
}

type UploadState = "idle" | "uploading" | "uploaded" | "failed";

export default function UploadEditor({ id }: { id: string }) {
	const [uploadState, setUploadState] = useState<UploadState>("idle");
	const [errorMessage, setErrorMessage] = useState("");

	// Editor state
	const [editorKey, setEditorKey] = useState(0);
	const [editorLoaded, setEditorLoaded] = useState(false);
	const [content, setContent] = useState("");
	const contentRef = useRef("");
	const [language, setLanguage] = useState("plaintext");
	const [theme, setTheme] = useState<any>(null);

	// File state
	const [filename, setFilename] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isBinary, setIsBinary] = useState(false);

	// Drag state
	const [isDragging, setIsDragging] = useState(false);
	const dragCounterRef = useRef(0);

	const fileInputRef = useRef<HTMLInputElement>(null);

	function loadFile(file: File) {
		setFilename(file.name);
		const ext = getExtension(file.name);
		if (ext) setLanguage(decideLanguageFromExtension(ext));

		if (!isTextExtension(file.name)) {
			setSelectedFile(file);
			setIsBinary(true);
			setContent("");
			contentRef.current = "";
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = (e.target?.result as string) ?? "";
			contentRef.current = text;
			setContent(text);
			setSelectedFile(file);
			setIsBinary(false);
			// Force Monaco to remount with new defaultValue so the cursor
			// is not disrupted if the user was already typing.
			setEditorKey((k) => k + 1);
		};
		reader.readAsText(file);
	}

	function clearFile() {
		setSelectedFile(null);
		setIsBinary(false);
		setFilename("");
		setLanguage("plaintext");
		setContent("");
		contentRef.current = "";
		setEditorKey((k) => k + 1);
	}

	function handleDragEnter(e: React.DragEvent) {
		e.preventDefault();
		dragCounterRef.current++;
		setIsDragging(true);
	}

	function handleDragLeave(e: React.DragEvent) {
		e.preventDefault();
		dragCounterRef.current--;
		if (dragCounterRef.current <= 0) {
			dragCounterRef.current = 0;
			setIsDragging(false);
		}
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		dragCounterRef.current = 0;
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) loadFile(file);
	}

	// Import via file picker
	function triggerImport() {
		fileInputRef.current?.click();
	}

	function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) loadFile(file);
		e.target.value = "";
	}

	function handleDownload() {
		const text = contentRef.current;
		const blob = new Blob([text], { type: "application/octet-stream" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename || "file.txt";
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleUpload() {
		const name = filename.trim() || "file.txt";
		const fileToUpload =
			isBinary && selectedFile
				? selectedFile
				: new File([contentRef.current], name, {
						type: "text/plain",
					});

		setUploadState("uploading");
		const result = await uploadFiles(id, fileToUpload);

		if (result.success) {
			setUploadState("uploaded");
		} else {
			setErrorMessage(
				result.reason ?? "An error occurred during the upload.",
			);
			setUploadState("failed");
		}
	}

	if (uploadState === "uploading") return <UploadingState />;
	if (uploadState === "uploaded") return <UploadedState />;
	if (uploadState === "failed")
		return <UploadFailedState onRetry={() => setUploadState("idle")} />;

	const canUpload = isBinary
		? !!selectedFile
		: content.length > 0 || filename.trim().length > 0;

	return (
		<div className="flex flex-col h-full w-full overflow-hidden relative">
			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				className="hidden"
				onChange={handleFileInputChange}
			/>

			<div
				className="flex-1 flex flex-col overflow-hidden relative"
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}
			>
				{/* Drag-over overlay */}
				{isDragging && (
					<div className="absolute inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none">
						<p className="bg-blue-900/80 px-6 py-4 rounded-2xl text-blue-200 text-xl font-semibold select-none backdrop-blur-xl">
							Drop to import file
						</p>
					</div>
				)}

				{/* Editor area */}
				{isBinary && selectedFile ? (
					// Binary file: show a card instead of the text editor
					<FileCard file={selectedFile} onRemove={clearFile} />
				) : (
					// Text / empty editor
					<div className="flex-1 overflow-hidden relative">
						{/* Empty-state hint */}
						{content === "" && editorLoaded && (
							<div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
								<div className="text-center space-y-1 select-none opacity-30">
									<p className="dark:text-neutral-300 text-neutral-600 text-base">
										Start typing, or
									</p>
									<p className="dark:text-neutral-500 text-neutral-400 text-sm">
										drag & drop / import a file
									</p>
								</div>
							</div>
						)}
						<Editor
							key={editorKey}
							defaultValue={content}
							language={language}
							theme={theme}
							onMount={() => setEditorLoaded(true)}
							options={{
								wordWrap: "on",
								minimap: { enabled: false },
								scrollBeyondLastLine: false,
							}}
							onChange={(value) => {
								const v = value ?? "";
								contentRef.current = v;
								setContent(v);
							}}
						/>
					</div>
				)}
			</div>

			{/* Navbar */}
			<UploadNavBar
				onUpload={handleUpload}
				canUpload={canUpload}
				onImport={triggerImport}
				onDownload={handleDownload}
				allowDownload={content.length > 0}
				theme={theme}
				setTheme={setTheme}
				language={language}
				setLanguage={setLanguage}
				showLanguageSelect={!isBinary}
				filename={filename}
				onFilenameChange={setFilename}
				filenameReadOnly={!!selectedFile}
			/>
		</div>
	);
}
