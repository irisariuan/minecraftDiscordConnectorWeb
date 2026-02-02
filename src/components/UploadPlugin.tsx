import { useState, useEffect } from "react";
import { verifyId, uploadFiles } from "../lib/request";
import Dropzone from "./Dropzone";
import PendingState from "./PendingState";
import ErrorState from "./ErrorState";
import UploadedState from "./UploadedState";

export default function UploadPlugin() {
	const [state, setState] = useState<
		"pending" | "dropzone" | "error" | "uploaded"
	>("pending");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [currentId, setCurrentId] = useState<string | null>(null);

	useEffect(() => {
		const initializePage = async () => {
			const params = new URLSearchParams(window.location.search);
			const id = params.get("id");

			if (!id) {
				console.error("No ID found in URL");
				setState("error");
				setErrorMessage("No ID found in URL parameters.");
				return;
			}

			setCurrentId(id);

			const data = await verifyId(id);

			if (!data.valid) {
				console.error("Invalid ID");
				setState("error");
				setErrorMessage("The provided ID is invalid.");
				return;
			}

			if (data.uploaded) {
				setState("uploaded");
				return;
			}

			setState("dropzone");
		};

		initializePage();
	}, []);

	const handleUpload = async (file: File) => {
		if (!currentId) return;

		const { success, reason } = await uploadFiles(currentId, file);

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
			{state === "pending" && <PendingState />}
			{state === "dropzone" && <Dropzone onUpload={handleUpload} />}
			{state === "error" && <ErrorState errorMessage={errorMessage} />}
			{state === "uploaded" && <UploadedState />}
		</>
	);
}
