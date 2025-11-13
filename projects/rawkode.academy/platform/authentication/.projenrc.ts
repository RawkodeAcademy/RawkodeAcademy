import { PlatformService } from '../../generators/projen-platform-service/src/';


const project = new PlatformService({
  serviceName: 'authentication',
	databaseId: "TBD", // Will be created during deployment
	includeWriteModel: true,
	additionalDependencies: {
		"better-auth": "^1.0.7",
		"capnp-ts": "^0.7.0",
	},
});

project.synth();
