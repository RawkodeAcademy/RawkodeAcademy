import {
	Container,
	dag,
	Directory,
	func,
	object,
} from "@dagger.io/dagger";

@object()
export class CastingCredits {
	/**
	 * Install dependencies and validate the setup for casting-credits service
	 */
	@func()
	async install(
		directory: Directory,
	): Promise<Container> {
		const bun = dag.bun();
		return await bun.withCache().then(b => b.install(directory));
	}

	/**
	 * Run tests for the casting-credits service
	 */
	@func()
	async test(
		directory: Directory,
	): Promise<Container> {
		const bun = dag.bun();
		const container = await bun.withCache().then(b => b.install(directory));
		
		return container.withExec(["bun", "test"]);
	}

	/**
	 * Run tests with coverage for the casting-credits service
	 */
	@func()
	async testCoverage(
		directory: Directory,
	): Promise<Container> {
		const bun = dag.bun();
		const container = await bun.withCache().then(b => b.install(directory));
		
		return container.withExec(["bun", "test", "--coverage"]);
	}
}