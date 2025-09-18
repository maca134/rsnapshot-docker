import { $ } from "bun";

export type BackupConfig = {
	exclude: string[];
	backup: {
		type: 'backup' | 'script';
		name: string;
		source: string;
		noagent?: boolean;
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
			.filter((url) => url.protocol === 'ssh:' || url.protocol === 'agent:')
			.filter((url, i, arr) => arr.findIndex((u) => u.hostname === url.hostname && u.port === url.port) === i)
			.map(
				(url) => $`ssh-keyscan -p "${url.port || url.protocol === 'agent:' ? '4156' : '22'}" -H "${url.hostname}" >> ${knownhosts}`
					.catch(() => console.error(`Error adding "${url.hostname}" to known hosts.`))
			)
	);

	const backup = [
		`verbose\t${process.env.LOGLEVEL ? process.env.LOGLEVEL : '2'}`,
		...config.exclude.map((e) => `exclude\t${e}`),
		...config.backup.map((b) => {
			switch (b.type) {
				case 'backup': {
					const url = new URL(b.source);
					switch (url.protocol) {
						case 'agent:': {
							return `backup\tagent@${url.hostname}:/backup\t${b.name}/\t+rsync_long_args=--rsync-path="sudo rsync",+ssh_args=-p${url.port || 4156}`;
						};
						case 'ssh:': {
							let line = `backup\t${url.username}@${url.hostname}:${url.pathname}\t${b.name}/\t`;
							if (url.port) {
								line += `+ssh_args=-p${url.port} `;
							}
							return line;
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

	console.log('rsnapshot config:');
	console.log(backup);

	await Bun.file(rsnapshot_conf_extra).write(backup);

	await $`rsnapshot -c ${rsnapshot_conf} configtest`;

	await $`rsnapshot -c ${rsnapshot_conf} ${period} 2>&1 | tee /snapshots/output-${period}.log`;

	await $`echo "Backup complete at ${new Date().toISOString()}" | tee /snapshots/report.log`;

	await $`rsnapshot -c ${rsnapshot_conf} du | tee -a /snapshots/report.log`;
}
