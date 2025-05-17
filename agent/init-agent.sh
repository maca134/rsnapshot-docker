#!/bin/sh

if [ -n "$KEY" ]; then
    echo "$KEY" > /home/agent/.ssh/authorized_keys
    chown agent:agent /home/agent/.ssh/authorized_keys
    chmod 600 /home/agent/.ssh/authorized_keys
fi

echo "Starting rsnapshot backup agent"

exec "$@"