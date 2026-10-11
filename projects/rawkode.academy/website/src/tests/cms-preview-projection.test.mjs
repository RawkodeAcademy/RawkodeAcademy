import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const context = vm.createContext({ Response, Request, URL, console });
const module = new vm.SourceTextModule(ts.transpileModule(
	readFileSync(new URL("../pages/__cms-preview-check.ts", import.meta.url), "utf8"),
	{ compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText, { context });
await module.link(specifier => {
	assert.equal(specifier, "@/lib/payload-content");
	return new vm.SyntheticModule(["getCollection", "getEntry"], function () {
		this.setExport("getCollection", async () => [{ id: "video", slug: "video", data: { title: "Video" } }]);
		this.setExport("getEntry", async () => undefined);
	}, { context });
});
await module.evaluate();

for (const scenario of ["safe", "missing", "full-files", "summary-local-path"]) {
	test(`preview requires real sanitized summary and full module projections: ${scenario}`, async () => {
		const views = [];
		const response = await module.namespace.POST({ locals: { runtime: { env: {
			PAYLOAD_PREVIEW_PR: "1419", PAYLOAD_PREVIEW_SHA: "a".repeat(40),
			PAYLOAD_CONTENT: { fetch: async request => {
				const url = new URL(request.url);
				if (url.pathname === "/v1/preview/readiness") return Response.json({
					scheduledVideo: { id: "scheduled", slug: "scheduled", title: "Scheduled", publishedAt: "2027-01-01T00:00:00Z" },
					d2SaveCapability: "unavailable",
				});
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
		} } } });
		assert.equal(response.status, scenario === "safe" ? 200 : 503);
		const body = await response.json();
		assert.equal(body.demoProjectionPrivate, scenario === "safe" ? true : undefined);
		if (scenario === "safe") assert.deepEqual(views, ["summary", "full"]);
	});
}

test("preview projection diagnostic remains unavailable outside PR previews", async () => {
	const response = await module.namespace.POST({ locals: {} });
	assert.equal(response.status, 404);
});
