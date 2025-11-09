# Copilot Agent Operating Protocol

Version: 2.0

Date: 2025-11-04

**Objective:** To provide a clear set of instructions for an autonomous AI agent to manage and execute development issues efficiently using a predefined set of tools and commands.

---

## 1. Core Principles

- **GitHub Issues are the Single Source of Truth:** All work must originate from, be tracked in, and be updated within a GitHub issue. Your work cycle begins and ends with an issue.
- **Autonomy through Planning:** Work autonomously on your assigned issue. Before writing any code, create a step-by-step plan.
- **Clarify, Don't Assume:** If any part of an issue description, requirement, or technical constraint is ambiguous, halt execution and ask the user for clarification.
- **Methodical Execution:** Follow the prescribed workflow and tool usage protocols without deviation.
- **Concise Communication:** Keep your status updates and questions clear, concise, and context-rich.

---

## 2. Standard Workflow Loop

This is your primary operational loop for every assigned issue.

### Issue Ingestion

When prompted, your first action is to ingest the issue.

- Use the **`gh` CLI** to find the issue by its number or title (e.g., `gh issue view [issue-number]`). If the user provides a new one, use `gh issue create` to create it first.
- Read the title, description, and any associated comments to fully understand the goal.
- Set the issue status by adding a label (e.g., `gh issue edit [issue-number] --add-label "In Progress"`).

### Context & Planning

- Break the issue down into a logical sequence of sub-tasks (e.g., 1. Replicate bug, 2. Identify root cause, 3. Implement fix, 4. Write test, 5. Submit PR).
- If technical documentation is required to understand an API, internal library, or architecture, query the **Ref MCP**. Example: #Ref/ref_search_documentation "Documentation for our internal DesignSystem API".

### Execution (Git & Source Code)

- Generate and execute the appropriate **`git` CLI commands** for all source code work.
- Create a new branch from the `dev` base branch. (e.g., `git fetch origin`, `git checkout -b [branch-name] origin/dev`).
- **Branch Naming Convention:** Use the format `[type]/[ISSUE-NUMBER]-[short-description]`.
- **Examples:** `feature/123-user-profile-page`, `bugfix/456-login-unresponsive`.
- Implement the necessary code changes and commit your work with clear, descriptive messages that reference the GitHub issue number (e.g., `git add .`, `git commit -m "feat(#123): Add user profile page"`).

### Review and Completion

- Once implementation is complete, push your branch to the remote repository (e.g., `git push origin [branch-name]`).
- Create a pull request using `gh pr create`. In the PR body, use a keyword like `Closes #[issue-number]` to automatically link the PR to the issue and close the issue upon merging.
- Add reviewers to the PR (e.g., `gh pr edit --add-reviewer [username]`).

---

## 3. Tool Usage Protocol

### 🔵 `gh` CLI (Primary Issue Manager)

- **Use:** At the start and end of every issue for tracking.
- **Actions:**
  - `gh issue view [issue-number]`: To fetch issue details.
  - `gh issue list --assignee "@me"`: To find issues assigned to you.
  - `gh issue create --title "..." --body "..."`: To create a new issue.
  - `gh issue edit [issue-number] --add-label "..." --remove-label "..."`: To change an issue's status via labels.
  - `gh issue comment [issue-number] --body "..."`: To add status updates or comments.
  - `gh pr create`: To create a pull request and link it to an issue.

### ⚫ Git CLI (Source Control)

- **Use:** For all code implementation issues.
- **Guidance:** Generate and execute vanilla `git` CLI commands directly for all source control operations.
- **Common Commands:**
  - `git fetch origin`
  - `git checkout -b [branch-name] origin/dev`
  - `git add [file-path]`
  - `git commit -m "[commit-message]"`
  - `git push origin [branch-name]`

### 🎨 Figma MCP (Design System & UI Specs)

- **Use:** Only when the user explicitly requests UI specifications, design details, or uses the keyword "figma".
- **Actions:**
  - #figma/create_design_system_rules : To generate design system rules based on a prompt.
  - #figma/get_design_context : To generate UI code for a given node or the currently selected node.
  - #figma/get_screenshot : To generate a screenshot for a given node or the currently selected node.

### 📚 Ref MCP (Technical Documentation)

- **Use:** When you need to understand established technical standards, APIs, or internal processes.
- **Actions:**
  - #Ref/ref_search_documentation : To search the documentation knowledge base.
  - #Ref/ref_read_url : To read a specific document.

### 🐞 Playwright MCP (Live Webpage Investigation)

- **Use:** To programmatically interact with a live webpage to replicate and understand visual or functional bugs before attempting a fix.
- **Guidance:** When an issue describes a bug that is hard to reproduce from code alone, use Playwright as a first step. Your goal is to navigate the live site, perform the user's actions, and gather context (like screenshots or element states) to inform your fix.
- **Actions:**
  - Generate and run scripts to mimic user behavior. Example: Create a Playwright script that navigates to '[https://example.com/login](https://example.com/login)', clicks the 'forgot-password' link, and takes a screenshot.
  - Inspect the state of web elements. Example: Check the CSS 'display' property of the element with selector 'error-message' after submitting the form with invalid data.

---

## 4. User Communication Protocol

When you need to ask for clarification, use the following format.

- **Subject:** Clarification Needed for Issue #[Issue-Number]
- **Context:** [Briefly describe what you are working on and what you have done so far.]
- **Blocker:** [Clearly state what information is missing or ambiguous.]
- **Question(s):**
  - [Specific, non-leading question 1.]
  - [Specific, non-leading question 2.]
