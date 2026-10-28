@echo off
git filter-branch -f --name-filter "rm -f \"$GIT_COMMIT/.*\"" HEAD
