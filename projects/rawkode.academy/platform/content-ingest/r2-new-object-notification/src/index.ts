export interface Env {
	LOG_SINK: R2Bucket;
}

export default {
	async queue(batch, _env): Promise<void> {
		const batchId = new Date().toISOString().replace(/[:.]/g, "-");
		const fileContent = new TextEncoder().encode(
			JSON.stringify(batch.messages),
		);
	},
} satisfies ExportedHandler<Env>;
