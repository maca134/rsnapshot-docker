import { $ } from "bun";

export type BackupConfig = {
	exclude: string[];
	backup: {
		type: 'backup' | 'script';
		name: string;
		source: string;
	}[];
};

type RsnapshotOptions = {
	period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly',
	config: BackupConfig,
	knownhosts: string;
	rsnapshot_conf: string;
	rsnapshot_conf_extra: string;
};

export async function rsnapshot({ period, config, knownhosts, rsnapshot_conf, rsnapshot_conf_extra }: RsnapshotOptions) {
	await Promise.all(
		config.backup
			.filter((b) => b.type === 'backup')
			.map((b) => new URL(b.source))
			.filter((url) => url.protocol === 'ssh:')
			.filter((url, i, arr) => arr.findIndex((u) => u.hostname === url.hostname && u.port === url.port) === i)
			.map(
				(url) =>
					$`ssh-keyscan -p "${url.port || '22'}" -H "${url.hostname}" >> ${knownhosts}`
						.catch(() => console.error(`Error adding "${url.hostname}" to known hosts.`))
			)
	);

	const backup = [
		...config.exclude.map((e) => `exclude\t${e}`),
		...config.backup.map((b) => {
			switch (b.type) {
				case 'backup': {
					const url = new URL(b.source);
					switch (url.protocol) {
						case 'ssh:': {
							return `backup\t${url.username}@${url.hostname}:${url.pathname}\t${b.name}/\t+ssh_args=-p${url.port || '22'}`;
						};

						case 'file:': {
							return `backup\t${url.pathname}\t${b.name}/`;
						};

						default:
							throw new Error(`Unsupported protocol: ${url.protocol}`);
					}
				};
				case 'script': {
					throw new Error(`Script backup not implemented: ${b.name}`);
				};
				default: {
					throw new Error(`Unknown backup type: ${b.type}`);
				}
			}
		})
	].join('\n');

	await Bun.file(rsnapshot_conf_extra).write(backup);

	await $`rsnapshot -c ${rsnapshot_conf} configtest`;

	await $`rsnapshot -c ${rsnapshot_conf} ${period}`;

	await $`echo "Backup complete at ${new Date().toISOString()}" > /snapshots/du.log`;
	
	await $`rsnapshot -c ${rsnapshot_conf} du >> /snapshots/du.log`;
}
