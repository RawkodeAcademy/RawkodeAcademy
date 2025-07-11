import { Component, JsonFile, type Project } from "projen";

type DaggerSdk = "typescript";

interface DaggerDependency {
	name: string;
	source: string;
}

interface Options {
	name?: string;
	engineVersion?: string;
	source?: string;
	sdk?: {
		source: DaggerSdk;
	};
	dependencies?: DaggerDependency[];
}

export class Dagger extends Component {
	constructor(project: Project, options: Options = {}) {
		super(project);

		const defaults: Required<Options> = {
			name: project.name,
			engineVersion: "v0.18.10",
			source: ".dagger",
			sdk: {
				source: "typescript",
			},
			dependencies: [{
				"name": "bun",
				"source": "../../../../dagger/bun"
			}],
		};

		const config = { ...defaults, ...options };

		new JsonFile(project, "dagger.json", {
			obj: config,
		});
	}
}
