import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({plugins:[tailwindcss()],base:'./',build:{target:'es2022',assetsInlineLimit:1000000,modulePreload:false,cssCodeSplit:false}});
