# Clean Workspace Command

A git workspace cleanup utility that helps remove stale branches and worktrees with interactive confirmation.

## Overview

The `clean-workspace` script performs three cleanup operations to keep your git workspace tidy:

1. **Remove extra worktrees** - Keeps only `main` or `master` worktrees
2. **Clean up orphaned local branches** - Removes local branches that track deleted remote branches
3. **Remove remote-only branches** - Deletes remote branches that don't have local counterparts

## What It Does

### Step 1: Worktree Cleanup
- Finds all git worktrees in your repository
- Identifies worktrees that are not on `main` or `master` branches
- Prompts for confirmation before removing them

### Step 2: Local Branch Cleanup
- Fetches latest remote information and prunes deleted remote branches
- Identifies local branches that track remote branches that no longer exist
- Prompts for confirmation before removing these orphaned local branches

### Step 3: Remote Branch Cleanup
- Compares remote branches with local branches
- Identifies remote branches that don't have local counterparts (excluding `main`/`master`)
- Prompts for confirmation before deleting these remote-only branches

## Safety Features

- **Interactive prompts** - Requires confirmation at each step before making changes
- **Protects main branches** - Never removes `main` or `master` branches
- **Graceful handling** - Skips steps if nothing needs to be cleaned
