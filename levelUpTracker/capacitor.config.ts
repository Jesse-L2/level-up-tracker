import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.levelup.tracker",
    appName: "Level Up Tracker",
    webDir: "dist",
    server: {
        androidScheme: "https",
    },
};

export default config;
