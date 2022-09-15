/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			keyframes: {
				shimmer: {
					'100%': {
						transform: 'translateX(100%)',
					},
				},
			},
		},
	},
	plugins: [
		require("./tailwind-scrollbar.cjs"),
	],
}
