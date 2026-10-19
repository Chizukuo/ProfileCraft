/// <reference types="vite/client" />

/** package.json 的 version，由 vite.config.ts 注入 */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
	readonly VITE_AI_FALLBACK_PROVIDER?: string;
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