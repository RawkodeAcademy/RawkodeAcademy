import {
	argument,
	type Container,
	dag,
	type Directory,
	func,
	object,
	File,
} from "@dagger.io/dagger";

@object()
export class Mp3ExtractionJob {
	/**
	 * Reference to the Deno module from the monorepo
	 */
	private denoModule() {
		// Path based on the dagger.json dependency
		// This assumes the deno module is correctly sourced by Dagger
		// and available in the 'dag' context if it were a pre-defined module.
		// For a local module, direct import might be different or it might be
		// available via `dag.directory("path/to/module").asModule()` if Dagger supports that,
		// or by codegen if `dagger develop` was run.
		// For now, this function is a placeholder for how Dagger would load it.
		// A simple approach is to directly use a Deno container.
		return dag.container().from("denoland/deno:alpine"); // Placeholder
	}

	private async getDenoContainer(
		@argument({ defaultPath: "." }) directory: Directory,
	): Promise<Container> {
		// Using a simple Deno container setup.
		// If `../../../../dagger/deno` offers a more complex setup, this should be adapted.
		const base = this.denoModule(); // Gets a Deno base image

		return base.withMountedCache("/deno-dir", dag.cacheVolume("deno-cache-" + Math.random())) // Unique cache volume name
		           .withEnvVariable("DENO_DIR", "/deno-dir")
		           .withDirectory("/app", directory)
		           .withWorkdir("/app");
	}

	/**
	 * Run the main application
	 */
	@func()
	async start(
		@argument({ defaultPath: "." }) directory: Directory,
	): Promise<Container> {
		const app = await this.getDenoContainer(directory);
		return app.withExec(["deno", "task", "start"]);
	}

	/**
	 * Run the main application in development mode (with watch)
	 */
	@func()
	async dev(
		@argument({ defaultPath: "." }) directory: Directory,
	): Promise<Container> {
		const app = await this.getDenoContainer(directory);
		return app.withExec(["deno", "task", "dev"]);
	}

	/**
	 * Cache Deno dependencies
	 */
	@func()
	async cache(
		@argument({ defaultPath: "." }) directory: Directory,
	): Promise<Container> {
		const app = await this.getDenoContainer(directory);
		return app.withExec(["deno", "task", "cache"]);
	}

	/**
	 * Rebuild audio files by triggering Google Cloud Run jobs
	 */
	@func()
	async rebuildAudio(
		@argument({ defaultPath: "." }) directory: Directory,
		@argument() videoIdsFile: File,
	): Promise<Container> {
		const gcloudSdk = dag.container().from("google/cloud-sdk:alpine");

		return gcloudSdk
			.withDirectory("/app", directory) // Mount the project directory
			.withMountedFile("/tmp/video-ids.txt", videoIdsFile) // Mount the specific file
			.withWorkdir("/app")
			.withExec(["sh", "./rebuild_audio_files.sh"]);
	}
}
