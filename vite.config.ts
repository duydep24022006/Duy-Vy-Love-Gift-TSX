import vinext from "vinext";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { sites } from "./build/sites-vite-plugin";

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

export default defineConfig(async () => {
  return {
    server: {
      ...(managedLinux
        ? {
          host: "0.0.0.0",
          allowedHosts: ["terminal.local"],
        }
        : {}),

      ...(isCodexSeatbeltSandbox
        ? {
          watch: {
            useFsEvents: false,
            usePolling: true,
          },
        }
        : {}),
    },

    plugins: [
      tailwindcss(),
      vinext(),
      sites({ mockAuth: !managedLinux }),
      nitro(),
    ],
  };
});