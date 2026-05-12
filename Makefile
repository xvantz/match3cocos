BUILD_DIR = build/web-mobile
DEPLOY_DIR = dist
BRANCH = gh-pages

.PHONY: help deploy clean setup

help:
	@echo "Available commands:"
	@echo "  make setup  - First settings (create worktree)"
	@echo "  make deploy - Deploy build from $(BUILD_DIR) to $(BRANCH)"
	@echo "  make clean  - Clear build directory"

setup:
	@git fetch origin
	@git checkout --orphan $(BRANCH) || git checkout $(BRANCH)
	@git rm -rf .
	@git commit --allow-empty -m "root: initial gh-pages"
	@git push origin $(BRANCH)
	@git checkout master
	@git worktree add $(DEPLOY_DIR) $(BRANCH)
	@touch $(DEPLOY_DIR)/.nojekyll

deploy:
	@echo "🚀 Start deploy..."
	@if [ ! -d "$(BUILD_DIR)" ]; then echo "❌ Error: First create build in Cocos!"; exit 1; fi
	
	rm -rf $(DEPLOY_DIR)/*
	touch $(DEPLOY_DIR)/.nojekyll
	
	cp -r $(BUILD_DIR)/* $(DEPLOY_DIR)/
	
	cd $(DEPLOY_DIR) && \
		git add . && \
		git commit -m "deploy: update build $$(date '+%Y-%m-%d %H:%M:%S')" && \
		git push origin $(BRANCH)
	
	@echo "✅ Success deploy to $(BRANCH)!"

clean:
	rm -rf build/
