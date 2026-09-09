.PHONY: deploy-dev dev-log

# Pull, build and restart the app on the Oracle VM (the `temply` ssh alias).
deploy-dev:
	ssh temply 'bash ~/temply-deploy/update.sh'

# The last 100 lines from both services on the VM.
dev-log:
	ssh temply 'journalctl -u temply-server -u temply-client -n 100 --no-pager'

run-local:
	bun run dev:public --keep-webhooks
