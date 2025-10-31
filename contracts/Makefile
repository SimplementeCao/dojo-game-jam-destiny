katana:
	katana --dev --dev.no-fee --http.cors_origins "*" 

setup:
	@./scripts/setup.sh

bindings:
	@./scripts/update_bindings.sh

.PHONY: katana setup bindings

%:
	@echo "Error: Command '$(MAKECMDGOALS)' is not defined."
	@echo "Available commands: katana, setup, bindings"
	@exit 1
