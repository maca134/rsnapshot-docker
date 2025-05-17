export const CONFIG_PATH = "/config/backup.json";
export const CRONTAB_PATH = "/config/crontab";

export const KEY_PATH = '/config/key';
export const PRIVATE_KEY = `${KEY_PATH}/server_id`;
export const PUBLIC_KEY = `${PRIVATE_KEY}.pub`;

export const SNAPSHOT_DIR = '/snapshots';

export const SSH_PATH = "/home/bun/.ssh"
export const SSH_KNOWNHOSTS = `${SSH_PATH}/known_hosts`

export const RSNAPSHOT_LOCK = '/app/rsnapshot.pid';

export const RSNAPSHOT_CONF = '/app/rsnapshot.conf';
export const RSNAPSHOT_CONF_EXTRA = '/app/rsnapshot-extra.conf';