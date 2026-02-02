import { useMonaco } from "@monaco-editor/react";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import Dracula from "../resources/Dracula.json";
import GitHubDark from "../resources/GitHubDark.json";
export default function ThemeSelect({
	theme,
	setTheme,
}: {
	theme: string;
	setTheme: Dispatch<SetStateAction<string>>;
}) {
	const monaco = useMonaco();
	useEffect(() => {
		if (!monaco) return;
		monaco.editor.defineTheme("dracula", Dracula as any);
		monaco.editor.defineTheme("github-dark", GitHubDark as any);
		setTheme("dracula");
	}, [monaco]);
	
	return (
		<select
			onChange={(event) =>
			{
				if (!event.currentTarget.selectedOptions[0]) return
				setTheme(event.currentTarget.selectedOptions[0].value)
			}
			}
			value={theme}
			className="bg-neutral-700 text-white p-2 rounded-2xl"
		>
			<option value="dracula">Dracula</option>
			<option value="github-dark">GitHub Dark</option>
		</select>
	);
}
