import { defineDmnoService } from "dmno";
import {
	EncryptedVaultDmnoPlugin,
	EncryptedVaultTypes,
} from "@dmno/encrypted-vault-plugin";

const MyProdVault = new EncryptedVaultDmnoPlugin("vault", {
	key: "abc",
});

export default defineDmnoService({
	isRoot: true,
	settings: {
		redactSensitiveLogs: true,
		interceptSensitiveLeakRequests: true,
		preventClientLeaks: true,
	},
	schema: {
		DMNO_VAULT_KEY: {
			extends: EncryptedVaultTypes.encryptionKey,
		},
		TURSO_URL: {
			sensitive: true,
		},
		TURSO_TOKEN: {
			sensitive: true,
		},
	},
});
