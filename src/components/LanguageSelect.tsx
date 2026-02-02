import type { Dispatch, SetStateAction } from "react";

export default function LanguageSelect({
	language,
	setLanguage,
}: {
	language: string;
	setLanguage: Dispatch<SetStateAction<string>>;
}) {
	return (
		<select
			onChange={(event) => {
				if (!event.currentTarget.selectedOptions[0]) return;
				setLanguage(event.currentTarget.selectedOptions[0].value);
			}}
			value={language}
			className="bg-neutral-700 text-white p-2 rounded-2xl"
		>
			<option value="javascript">JavaScript</option>
			<option value="typescript">TypeScript</option>
			<option value="python">Python</option>
			<option value="json">JSON</option>
			<option value="java">Java</option>
			<option value="yaml">YAML</option>
			<option value="xml">XML</option>
			<option value="plaintext">Plain Text</option>
			<option value="csharp">C#</option>
			<option value="cpp">C++</option>
			<option value="ruby">Ruby</option>
			<option value="go">Go</option>
			<option value="php">PHP</option>
			<option value="swift">Swift</option>
			<option value="kotlin">Kotlin</option>
			<option value="rust">Rust</option>
			<option value="html">HTML</option>
			<option value="css">CSS</option>
			<option value="markdown">Markdown</option>
		</select>
	);
}
