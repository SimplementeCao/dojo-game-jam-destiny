import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import mkcert from 'vite-plugin-mkcert'
import path from "path";
import tailwindcss from '@tailwindcss/vite'
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait(), mkcert(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // server: {
  //   // host: "0.0.0.0", // or your local network IP
  //   https: {
  //     key: fs.readFileSync(path.resolve(__dirname, "localhost+2-key.pem")),
  //     cert: fs.readFileSync(path.resolve(__dirname, "localhost+2-cert.pem")),
  //   },
  // },
})
