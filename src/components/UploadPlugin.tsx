import { useState } from "react";
import { uploadFiles } from "../lib/request";
import Dropzone from "./Dropzone";
import ErrorState from "./states/ErrorState";
import UploadedState from "./states/UploadedState";

export default function UploadPlugin({ id }: { id: string }) {
	const [state, setState] = useState<"dropzone" | "error" | "uploaded">(
		"dropzone",
	);
	const [errorMessage, setErrorMessage] = useState<string>("");

	const handleUpload = async (file: File) => {
		const { success, reason } = await uploadFiles(id, file);

		if (success) {
			setState("uploaded");
		} else {
			setState("error");
			setErrorMessage(
				reason ??
					"An error occurred during the upload. Please try again.",
			);
		}
	};

	return (
		<>
			{state === "dropzone" && <Dropzone onUpload={handleUpload} />}
			{state === "error" && <ErrorState errorMessage={errorMessage} />}
			{state === "uploaded" && <UploadedState />}
		</>
	);
}
