import {
	argument,
	type Container,
	dag,
	type Directory,
	func,
	object,
} from "@dagger.io/dagger";

@object()
export class CastingCredits {
	async install(
		@argument({ defaultPath: "." }) directory: Directory,
	): Promise<Container> {
		const bun = dag.bun();
		return await bun.withCache().installNoCache(directory);
	}

	/**
	 * Run tests for the casting-credits service
	 */
	@func()
	async test(
		@argument({ defaultPath: "." }) directory: Directory,
	): Promise<Container> {
		const app = await this.install(directory);
		return app.withExec(["bun", "test"]);
	}

	/**
	 * Run tests with coverage for the casting-credits service
	 */
	@func()
	async testCoverage(
		@argument({ defaultPath: "." }) directory: Directory,
	): Promise<Container> {
		const app = await this.install(directory);
		return app.withExec(["bun", "test", "--coverage"]);
	}

	/**
	 * Deploy the casting-credits service read model
	 */
	@func()
	async deploy(
		@argument({ defaultPath: "." }) directory: Directory,
		@argument() serviceName: string,
		@argument() libsqlBaseUrl: string,
	): Promise<Container> {
		// This is a placeholder. The actual implementation would involve
		// translating the Justfile script into Dagger steps.
		// For now, it will just echo the intent.
		const app = await this.install(directory);
		return app.withExec([
			"echo",
			"Deploying read model for",
			serviceName,
			"with LİBSQL_BASE_URL",
			libsqlBaseUrl,
			"using wrangler and wgc (implementation pending)",
		]);
	}
}
