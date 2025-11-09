# Git Workspace Cleanup Procedure

This procedure guides you through identifying and optionally removing unnecessary git worktrees and branches to keep your workspace clean and organized.

## Overview

The cleanup process consists of three main steps:

1. **Worktrees**: Identify and remove additional working directories
2. **Orphaned Local Branches**: Find local branches that track remote branches that no longer exist
3. **Remote-Only Branches**: Locate remote branches that don't have local counterparts

At each step, you'll be shown what was found and asked to confirm before any removal occurs. Protected branches (main, master, dev, develop) are never removed automatically.

---

## Step 1: Worktrees

**What are worktrees?**
Worktrees allow you to have multiple working directories for the same repository, each checked out to a different branch. Over time, you may accumulate worktrees that are no longer needed.

**Procedure:**

1. The system scans for all existing worktrees in your repository
2. It identifies worktrees that are not one of the protected branches (main, master, dev, develop)
3. You'll see a list of worktrees that can be removed, showing:
   - The path where the worktree is located
   - The branch it's checked out to
4. **You decide**: Review the list and choose whether to remove these worktrees
5. If you confirm, the worktrees will be removed (keeping only the protected branches)

**Note**: Removing a worktree does not delete the branch itself, only the additional working directory.

---

## Step 2: Orphaned Local Branches

**What are orphaned local branches?**
These are local branches that were tracking remote branches that have since been deleted. They're "orphaned" because their remote counterpart no longer exists.

**Procedure:**

1. The system updates your remote tracking information to see what's current
2. It identifies local branches that track remote branches marked as "gone"
3. Protected branches (main, master, dev, develop) are automatically excluded
4. You'll see a list of orphaned local branches
5. **You decide**: Review each branch and choose whether to remove them
6. If you confirm, the local branches will be deleted
   - The system will try a safe deletion first
   - If a branch has unmerged changes, you may need to force delete it manually

**Note**: Only branches tracking deleted remotes are shown. Local-only branches (never pushed) are not included.

---

## Step 3: Remote-Only Branches

**What are remote-only branches?**
These are branches that exist on the remote repository but don't have a corresponding local branch. They may be leftover from old features or experiments.

**Procedure:**

1. The system compares your local branches with remote branches
2. It identifies remote branches that don't have a local counterpart
3. Protected branches (main, master, dev, develop) are automatically excluded
4. You'll see a list of remote-only branches
5. **You decide**: Review the list carefully and choose whether to delete them from the remote
6. If you confirm, these branches will be permanently deleted from the remote repository

**Warning**: Deleting remote branches is permanent and affects all collaborators. Make sure these branches are truly no longer needed before confirming.

---

## Safety Features

- **Protected Branches**: The main, master, dev, and develop branches are never automatically removed
- **User Confirmation**: Every removal step requires your explicit confirmation
- **Dry Run**: You can review what will be removed before confirming
- **Graceful Handling**: If a branch can't be removed (e.g., has unmerged changes), the system will note it and continue

---

## Best Practices

1. **Review Carefully**: Take time to review each list before confirming removal
2. **Check with Team**: For remote branch deletion, coordinate with your team to ensure no one is using those branches
3. **Regular Cleanup**: Run this procedure periodically to keep your workspace tidy
4. **Backup First**: If unsure, create a backup or note down branch names before deletion

---

## What Gets Preserved

- Your current working directory and branch
- Protected branches (main, master, dev, develop)
- Local branches that still track active remote branches
- Remote branches that have local counterparts
