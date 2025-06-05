import { dag, Directory, File, func, object, Secret } from "@dagger.io/dagger";

@object()
export class Cloudflare {
	/**
	 * Deploy a website to Cloudflare Workers.
	 */
	@func()
	async deploy(
		dist: Directory,
		wranglerConfig: File,
		cloudflareApiToken: Secret,
	): Promise<string> {
		const cloudflareAccountId = await dag.config().cloudflareAccountId();

		const wranglerFilename = await wranglerConfig.name();

		const deploymentResult = await dag
			.container()
			.from("node:22")
			.withWorkdir("/deploy")
			// Only doing this to cache the wrangler installation
			.withExec(["npx", "wrangler", "--version"])
			.withMountedDirectory("/deploy/dist", dist)
			.withMountedFile(`/deploy/${wranglerFilename}`, wranglerConfig)
			.withEnvVariable("CLOUDFLARE_ACCOUNT_ID", cloudflareAccountId)
			.withSecretVariable("CLOUDFLARE_API_TOKEN", cloudflareApiToken)
			.withExec(["npx", "wrangler", "deploy"]);

		if ((await deploymentResult.exitCode()) !== 0) {
			throw new Error(
				"Deployment failed. Error: " +
					(await deploymentResult.stdout()) +
					(await deploymentResult.stderr()),
			);
		}

		return deploymentResult.stdout();
	}

	/**
	 * Deploy a preview website to Cloudflare Workers.
	 */
	@func()
	async preview(
		dist: Directory,
		wranglerConfig: File,
		cloudflareApiToken: Secret,
		githubApiToken: Secret,
		repository: string,
		pullRequestNumber: string,
	): Promise<string> {
		const cloudflareAccountId = await dag.config().cloudflareAccountId();

		const wranglerFilename = await wranglerConfig.name();
		const previewName = `pr-${pullRequestNumber}`;

		const deploymentResult = await dag
			.container()
			.from("node:22")
			.withWorkdir("/deploy")
			// Only doing this to cache the wrangler installation
			.withExec(["npx", "wrangler", "--version"])
			.withMountedDirectory("/deploy/dist", dist)
			.withMountedFile(`/deploy/${wranglerFilename}`, wranglerConfig)
			.withEnvVariable("CLOUDFLARE_ACCOUNT_ID", cloudflareAccountId)
			.withSecretVariable("CLOUDFLARE_API_TOKEN", cloudflareApiToken)
			.withExec(["npx", "wrangler", "deploy", "--name", previewName]);

		if ((await deploymentResult.exitCode()) !== 0) {
			throw new Error(
				"Deployment failed. Error: " +
					(await deploymentResult.stdout()) +
					(await deploymentResult.stderr()),
			);
		}

		const allOutput = await deploymentResult.stdout();

		// Extract the preview URL from the output - look for the deployed URL
		const urlMatch = allOutput.match(/https:\/\/[^\s]+\.workers\.dev/);
		const previewUrl = urlMatch ? urlMatch[0] : `https://${previewName}.${cloudflareAccountId}.workers.dev`;

		await dag
			.github()
			.postPullRequestComment(
				githubApiToken,
				repository,
				pullRequestNumber,
				`🎨 Storybook Preview: ${previewUrl}`,
			)
			.exitCode();

		return allOutput;
	}
}
