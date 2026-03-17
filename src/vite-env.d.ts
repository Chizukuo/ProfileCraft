/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_AI_FALLBACK_API_KEY?: string;
	readonly VITE_AI_FALLBACK_BASE_URL?: string;
	readonly VITE_AI_FALLBACK_MODEL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module '*.css?raw' {
	const content: string;
	export default content;
}