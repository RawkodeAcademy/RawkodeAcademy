import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

let currentEnv;
const context = vm.createContext({ Response, Request, URL, console });
const module = new vm.SourceTextModule(ts.transpileModule(
	readFileSync(new URL("../pages/api/cms-preview-check.ts", import.meta.url), "utf8"),
	{ compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText, { context });
await module.link(specifier => {
	assert.equal(specifier, "@/lib/payload-content");
	return new vm.SyntheticModule(["getCollection", "getEntry", "getPayloadRequestState"], function () {
		this.setExport("getCollection", async () => [{ id: "video", slug: "video", data: { title: "Video" } }]);
		this.setExport("getEntry", async () => undefined);
		this.setExport("getPayloadRequestState", () => ({env: currentEnv}));
	}, { context });
});
await module.evaluate();

for (const scenario of ["safe", "missing", "full-files", "summary-local-path"]) {
	test(`preview requires real sanitized summary and full module projections: ${scenario}`, async () => {
		const views = [];
		currentEnv = {
			PAYLOAD_PREVIEW_PR: "1419", PAYLOAD_PREVIEW_SHA: "a".repeat(40),
			PAYLOAD_CONTENT: { fetch: async request => {
				const url = new URL(request.url);
				assert.equal(request.method, "GET");
				assert.equal(url.pathname, "/v1/collections/course-modules");
				const view = url.searchParams.get("view");
				views.push(view);
				if (scenario === "missing") return Response.json({ doc: null });
				const doc = { slug: "complete-guide-zitadel/01-introduction" };
				if (view === "full") doc.contentResources = [{ embedConfig: { container: "webcontainer", src: "demo" } }];
				if (scenario === "full-files" && view === "full") doc.contentResources[0].embedConfig.files = { "secret.js": "source" };
				if (scenario === "summary-local-path" && view === "summary") doc.unexpected = { localDir: "../../private" };
				return Response.json({ doc });
			} },
		};
		const response = await module.namespace.GET({locals: {get runtime() {throw new Error("Removed Astro runtime API accessed")}}});
		assert.equal(response.status, scenario === "safe" ? 200 : 503);
		const body = await response.json();
		assert.equal(body.demoProjectionPrivate, scenario === "safe" ? true : undefined);
		if (scenario === "safe") assert.deepEqual(views, ["summary", "full"]);
	});
}

test("preview projection diagnostic remains unavailable outside PR previews", async () => {
	currentEnv = undefined;
	const response = await module.namespace.GET({ locals: {} });
	assert.equal(response.status, 404);
});
