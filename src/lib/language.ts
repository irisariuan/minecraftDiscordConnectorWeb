export function decideLanguageFromExtension(extension: string): string {
	switch (extension) {
		case "js":
		case "jsx":
			return "javascript";
		case "ts":
		case "tsx":
			return "typescript";
		case "py":
			return "python";
		case "java":
			return "java";
		case "rb":
			return "ruby";
		case "go":
			return "go";
		case "rs":
			return "rust";
		case "php":
			return "php";
		case "swift":
			return "swift";
		case "kt":
		case "kts":
			return "kotlin";
		case "cs":
			return "csharp";
		case "cpp":
		case "cc":
		case "cxx":
		case "c++":
		case "h":
		case "hpp":
			return "cpp";
		case "html":
		case "htm":
			return "html";
		case "css":
		case "scss":
		case "sass":
			return "css";
		case "json":
			return "json";
		case "md":
		case "markdown":
			return "markdown";
		case "yaml":
		case "yml":
			return "yaml";
		case "xml":
			return "xml";
		case "txt":
			return "plaintext";
		default:
			return "plaintext";
	}
}
