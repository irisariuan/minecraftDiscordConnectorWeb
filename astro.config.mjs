// @ts-check
import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},

	adapter: node({
		mode: "middleware",
	}),

	integrations: [react()],
	env: {
		schema: {
			API_BASE_URL: envField.string({
				access: "public",
				context: "client",
				optional: true,
			}),
		},
	},
});
