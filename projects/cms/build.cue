package cms

import (
	"dagger.io/dagger"
	"dagger.io/dagger/core"
	"universe.dagger.io/docker"
	"universe.dagger.io/yarn"
	"universe.dagger.io/alpha/pulumi"
)

#Build: {
	config: {
		github: token: dagger.#Secret
		mongodb: atlas: {
			publicKey:  string
			privateKey: dagger.#Secret
		}
		platform: kubeconfig: dagger.#Secret
		pulumi: accessToken:  dagger.#Secret
	}

	_codePulumi: core.#Source & {
		path: "./pulumi"
		exclude: [
			"./node_modules",
		]
	}

	pulumiUp: pulumi.#Up & {
		cacheKey:    "cms-production-1"
		stack:       "production"
		stackCreate: true
		runtime:     "nodejs"
		accessToken: config.pulumi.accessToken
		source:      _codePulumi.output

		container: env: {
			KUBECONFIG:                config.platform.kubeconfig
			MONGODB_ATLAS_PUBLIC_KEY:  config.mongodb.atlas.publicKey
			MONGODB_ATLAS_PRIVATE_KEY: config.mongodb.atlas.privateKey
		}
	}

	_cmsCode: core.#Source & {
		path: "./payloadcms"
		exclude: [
			"./dist",
			"./node_modules",
		]
	}

	buildCmd: yarn.#Script & {
		source:  _cmsCode.output
		project: "cms"
		name:    "build:server"
		container: env: YARN_OUTPUT_FOLDER: "dist"
	}

	buildImage: docker.#Build & {
		steps: [
			docker.#Pull & {
				source: "node:18"
			},

			docker.#Copy & {
				contents: buildCmd.container.export.directories."/output"
				dest:     "/app"
			},

			docker.#Set & {
				config: cmd: ["node", "/app/server.js"]
			},
		]
	}

	pushImage: docker.#Push & {
		image: buildImage.output
		dest:  "ghcr.io/rawkodeacademy/cms:latest"

		auth: {
			username: "rawkode"
			secret:   config.github.token
		}
	}
}
