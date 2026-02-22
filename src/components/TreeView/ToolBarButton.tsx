import { motion, useAnimate } from "framer-motion";
import type { ReactNode } from "react";

export default function ToolBarButton({
	onClick,
	className = "",
	children,
}: {
	onClick: () => void;
	className?: string;
	children: ReactNode;
}) {
	const [ref, animate] = useAnimate();
	return (
		<motion.button
			animate={{ scale: [0, 1] }}
			exit={{ scale: [1, 0] }}
			ref={ref}
			className={`bg-white dark:bg-neutral-950 p-1 rounded shadow dark:shadow-neutral-500 text-neutral-500 dark:text-neutral-400 cursor-pointer transition-colors ${className}`}
			onClick={() => {
				onClick();
				animate(ref.current, { scale: [1, 0.6, 1] }, { duration: 0.4 });
			}}
		>
			{children}
		</motion.button>
	);
}
