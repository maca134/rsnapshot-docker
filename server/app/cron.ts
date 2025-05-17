import { sleep } from "bun";
import { CONFIG_PATH, RSNAPSHOT_CONF, RSNAPSHOT_CONF_EXTRA, SSH_KNOWNHOSTS, } from "./constants";
import { rsnapshot, type BackupConfig } from "./rsnapshot";

try {
	await rsnapshot({
		period: (process.argv[2] || "hourly") as "hourly" | "daily" | "weekly" | "monthly",
		config: await Bun.file(CONFIG_PATH).json() as BackupConfig,
		knownhosts: SSH_KNOWNHOSTS,
		rsnapshot_conf: RSNAPSHOT_CONF,
		rsnapshot_conf_extra: RSNAPSHOT_CONF_EXTRA,
	});
} catch (error) {
	console.error("Error running rsnapshot");
}

await sleep(10000);