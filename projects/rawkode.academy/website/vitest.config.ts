/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

// HINT: setting the vars via "test.env" inside the "getViteConfig" object does not work :/
process.env.ZITADEL_URL = "some-zitadel-url";
process.env.ZITADEL_CLIENT_ID = "some-client-id";

export default defineConfig({
	test: {
		include: ["src/**/*.{spec,test}.{ts,tsx}"],
		mockReset: true,
	},
});
