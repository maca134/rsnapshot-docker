import { mkdir, exists } from "node:fs/promises";
import { $ } from "bun";
import { CONFIG_PATH, KEY_PATH, PRIVATE_KEY, PUBLIC_KEY, RSNAPSHOT_CONF, RSNAPSHOT_CONF_EXTRA, RSNAPSHOT_LOCK, SNAPSHOT_DIR, SSH_KNOWNHOSTS, SSH_PATH } from "./constants";
import { rsnapshot, type BackupConfig } from "./rsnapshot";

if (!(await exists(PRIVATE_KEY))) {
	console.log("Generating SSH key pair...");
	await mkdir(KEY_PATH, { recursive: true });
	await Bun.spawn([
		"ssh-keygen",
		"-q",
		"-N", "",
		"-f", PRIVATE_KEY,
	]).exited;
	await $`awk '{print $1, $2}' ${PUBLIC_KEY} > ${PUBLIC_KEY}_tmp && mv ${PUBLIC_KEY}_tmp ${PUBLIC_KEY}`;
	const publicKey = await Bun.file(PUBLIC_KEY).text();
	console.log("Public key generated:");
	console.log(publicKey);
	console.log("Copying public key to authorized keys...");
	await $`sleep 10`;
}

if (!(await exists(SNAPSHOT_DIR))) {
	console.log("Creating snapshot directory...");
	await mkdir(SNAPSHOT_DIR, { recursive: true });
}

if (await exists('/tmp/rsnapshot.lock')) {
	console.log("Removing old flock rsnapshot PID file...");
	await $`rm /tmp/rsnapshot.lock`;
}

if (await exists(RSNAPSHOT_LOCK)) {
	console.log("Removing old rsnapshot PID file...");
	await $`rm ${RSNAPSHOT_LOCK}`;
}

if (!(await exists(SSH_PATH))) {
	console.log("Creating SSH_PATH directory...");
	await mkdir(SSH_PATH, { recursive: true });
}

if (!(await exists(CONFIG_PATH))) {
	console.log("Config file not found. Creating default config...");
	await Bun.file(CONFIG_PATH).write(
		JSON.stringify({
			exclude: [],
			backup: [
				{
					type: "backup",
					name: "local",
					source: "file:///home",
				}
			],
		}, null, 2)
	);
	console.log("Config file created. Please edit it to add your backup sources.");
}

try {
	await rsnapshot({
		period: "hourly",
		config: await Bun.file(CONFIG_PATH).json() as BackupConfig,
		knownhosts: SSH_KNOWNHOSTS,
		rsnapshot_conf: RSNAPSHOT_CONF,
		rsnapshot_conf_extra: RSNAPSHOT_CONF_EXTRA,
	});
} catch (error) {
	console.error("Error running rsnapshot");
}

await $`/usr/local/bin/supercronic --passthrough-logs /app/crontab`;