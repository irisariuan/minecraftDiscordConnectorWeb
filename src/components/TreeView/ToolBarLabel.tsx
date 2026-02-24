import { motion } from "framer-motion";
export default function ToolBarLabel({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<motion.span
			className="p-1 text-xs rounded bg-white dark:bg-neutral-800 shadow dark:shadow-neutral-500 text-neutral-500 dark:text-neutral-400 h-full select-none"
			animate={{ scale: [0, 1] }}
			exit={{ scale: [1, 0] }}
		>
			{children}
		</motion.span>
	);
}
