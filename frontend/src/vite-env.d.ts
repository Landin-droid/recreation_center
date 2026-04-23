/* eslint-env browser */

declare module "*.css" {
  const styles: Record<string, string>;
  export default styles;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
