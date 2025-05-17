FROM alpine:latest AS release

RUN apk add --no-cache openssh bash rsync sudo

RUN adduser -D agent

RUN passwd -u agent

RUN echo "agent ALL=(root) NOPASSWD: /usr/bin/rsync" >> /etc/sudoers

RUN mkdir -p /home/agent/.ssh && \
    chown agent:agent /home/agent/.ssh && \
    chmod 700 /home/agent/.ssh && \
    touch /home/agent/.ssh/authorized_keys && \
    chown agent:agent /home/agent/.ssh/authorized_keys && \
    chmod 600 /home/agent/.ssh/authorized_keys && \
    echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config && \
    echo 'PermitRootLogin no' >> /etc/ssh/sshd_config && \
    echo 'AuthorizedKeysFile .ssh/authorized_keys' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config && \
    echo 'ChallengeResponseAuthentication no' >> /etc/ssh/sshd_config

COPY init-agent.sh /init-agent.sh
RUN pwd
RUN chmod +x /init-agent.sh

RUN ssh-keygen -A

EXPOSE 22

ENV KEY=""

ENTRYPOINT ["/init-agent.sh"]

CMD ["/usr/sbin/sshd", "-D", "-e"]