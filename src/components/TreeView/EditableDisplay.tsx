import { useRef, useState } from "react";

export default function EditableDisplay({
	defaultValue,
	validate,
	className,
	onSuccess,
	overrideClassName,
	disabled,
	placeholderText = "Nil",
}: {
	defaultValue?: string;
	validate: (input: string) => boolean;
	onSuccess: (input: string) => string;
	className?: string;
	overrideClassName?: boolean;
	disabled?: boolean;
	placeholderText?: string;
}) {
	const ref = useRef<HTMLInputElement | null>(null);
	const [text, setText] = useState(defaultValue);
	return (
		<input
			ref={ref}
			defaultValue={defaultValue}
			type="text"
			className={
				overrideClassName
					? className
					: `outline-0 placeholder:text-red-400 placeholder:italic ${className ?? ''}`
			}
			placeholder={placeholderText}
			disabled={disabled}
			onBlur={(inp) => {
				if (inp.currentTarget.value === text) return
				if (!validate(inp.currentTarget.value)) {
					inp.preventDefault();
					if (!text) return;
					inp.currentTarget.value = text;
					return;
				}
				setText(onSuccess(inp.currentTarget.value));
			}}
		/>
	);
}
