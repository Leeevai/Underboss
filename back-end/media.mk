#
# Media Management Makefile
#
# This file provides targets for managing media files.
# Include from the main Makefile: -include media.mk
#
# Source files are stored in media/test/ and copied to media/ on demand.
# The copy uses rsync --ignore-existing to never overwrite existing files.
#

MEDIA_DIR = media
TEST_MEDIA_DIR = $(MEDIA_DIR)/test

.PHONY: test_media
test_media:
	###
	#
	# Populating media from test sources (without overwriting)
	#
	@if [ -d "$(TEST_MEDIA_DIR)" ]; then \
		rsync -av --ignore-existing $(TEST_MEDIA_DIR)/ $(MEDIA_DIR)/ --exclude test; \
		echo "Media populated from $(TEST_MEDIA_DIR) (existing files preserved)"; \
	else \
		echo "Error: $(TEST_MEDIA_DIR) not found"; \
		exit 1; \
	fi

.PHONY: test_media.force
test_media.force:
	###
	#
	# Populating media from test sources (OVERWRITING existing files)
	#
	@if [ -d "$(TEST_MEDIA_DIR)" ]; then \
		rsync -av $(TEST_MEDIA_DIR)/ $(MEDIA_DIR)/ --exclude test; \
		echo "Media populated from $(TEST_MEDIA_DIR) (existing files overwritten)"; \
	else \
		echo "Error: $(TEST_MEDIA_DIR) not found"; \
		exit 1; \
	fi

.PHONY: test_media.status
test_media.status:
	###
	#
	# Comparing media with test sources
	#
	@echo "=== Files in test but missing from media ==="
	@for f in $$(find $(TEST_MEDIA_DIR) -type f 2>/dev/null); do \
		target=$$(echo "$$f" | sed 's|$(TEST_MEDIA_DIR)/||'); \
		if [ ! -f "$(MEDIA_DIR)/$$target" ]; then \
			echo "[MISSING] $$target"; \
		fi; \
	done
	@echo ""
	@echo "=== Summary ==="
	@test_count=$$(find $(TEST_MEDIA_DIR) -type f 2>/dev/null | wc -l | tr -d ' '); \
	media_count=$$(find $(MEDIA_DIR) -type f -not -path "$(TEST_MEDIA_DIR)/*" 2>/dev/null | wc -l | tr -d ' '); \
	echo "Test source files: $$test_count"; \
	echo "Media files: $$media_count"

.PHONY: test_media.clean
test_media.clean:
	###
	#
	# Removing media files (keeps test sources)
	#
	@for dir in asap category post spap user; do \
		if [ -d "$(MEDIA_DIR)/$$dir" ] && [ "$$dir" != "test" ]; then \
			rm -rf "$(MEDIA_DIR)/$$dir"; \
			echo "Removed: $(MEDIA_DIR)/$$dir"; \
		fi; \
	done
	@echo "Media cleaned. Run 'make test_media' to restore."
