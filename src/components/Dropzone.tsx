import { useState, useRef } from "react";

interface DropzoneProps {
	onUpload: (file: File) => Promise<void>;
}

export default function Dropzone({ onUpload }: DropzoneProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!e.dataTransfer) return;
		const file = e.dataTransfer.files[0];
		if (file) {
			setSelectedFile(file);
		}
	};

	const handleFileSelect = () => {
		fileInputRef.current?.click();
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files[0]) {
			setSelectedFile(files[0]);
		}
	};

	const handleRemoveFile = () => {
		setSelectedFile(null);
	};

	const handleUploadClick = async () => {
		if (!selectedFile) return;
		setIsUploading(true);
		await onUpload(selectedFile);
	};

	return (
		<div
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className="bg-black flex-1 w-full hover:cursor-grab active:cursor-grabbing flex items-center justify-center flex-col gap-4 p-4"
		>
			<p className="text-5xl text-white select-none">Drop your files here</p>
			<button
				onClick={handleFileSelect}
				className="text-3xl text-gray-400 hover:cursor-pointer hover:bg-white hover:text-gray-800 p-4 rounded-4xl transition-colors"
			>
				Or else, upload
			</button>
			{selectedFile && (
				<p
					onClick={handleRemoveFile}
					className="text-white text-xl select-none break-all hover:cursor-pointer"
				>
					{selectedFile.name}
				</p>
			)}
			{selectedFile && (
				<button
					onClick={handleUploadClick}
					disabled={isUploading}
					className="text-white border border-px border-white p-4 rounded-4xl w-full hover:cursor-pointer hover:bg-white hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isUploading ? "Uploading..." : "Upload"}
				</button>
			)}
			<input
				ref={fileInputRef}
				type="file"
				onChange={handleFileInputChange}
				style={{ display: "none" }}
			/>
		</div>
	);
}
