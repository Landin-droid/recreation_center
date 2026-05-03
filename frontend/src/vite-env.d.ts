/* eslint-env browser */

declare module "*.css" {
  const styles: Record<string, string>;
  export default styles;
}

interface ImportMetaEnv {
  VITE_EMAILJS_TEMPLATE_RESET_PASWORD_ID: string;
  VITE_EMAILJS_TEMPLATE_RESERVATION_ID: string;
  VITE_EMAILJS_SERVICE_ID: string;
  VITE_EMAILJS_PUBLIC_KEY: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
