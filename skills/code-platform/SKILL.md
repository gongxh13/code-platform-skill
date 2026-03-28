---
name: code-platform
description: Universal code repository platform API tool supporting Issue and PR management for GitCode/AtomGit/GitLab and more
---

# Code Platform

Universal code repository platform API tool for Issue and PR management on GitCode/AtomGit and other platforms.

## When to Use

Use this skill for:
- Issue creation, query, update, and claim
- PR creation, query, and update
- Automated scanning and aggregation of repository data

**Important**: All API operations must use `platform-api.js`. Do NOT use curl or gh commands.

## Features

### Configuration

Config file: `./code-platform-config.json`

```json
{
  "token": "your-platform-token",
  "owner": "owner-name",
  "repo": "repository-name",
  "platformType": "gitcode"
}
```

### Issue Operations

```bash
# Create Issue
platform-api create-issue --title "Title" --description "Description"

# Get Issue Details
platform-api get-issue --id 123

# Claim Issue (assign to yourself)
platform-api claim-issue --id 123

# Update Issue
platform-api update-issue --id 123 --title "New Title" --body "New Content"

# List Issues
platform-api list-issues --state open
```

### PR Operations

```bash
# Create PR
platform-api create-pr --title "PR Title" --description "Description" --source-branch "branch-name" --target-branch "main"

# Update PR
platform-api update-pr --id 123 --title "New Title"

# List PRs
platform-api list-prs --state open
```

### Command Reference

| Command | Description |
|---------|-------------|
| `init` | Initialize platform configuration |
| `create-issue` | Create new Issue |
| `get-issue` | Get Issue details |
| `claim-issue` | Claim Issue (assign to fork.owner) |
| `update-issue` | Update Issue |
| `list-issues` | List Issues |
| `create-pr` | Create PR |
| `update-pr` | Update PR |
| `list-prs` | List PRs |

Full help: `platform-api --help`

## Initialization

When configuration is missing, follow these steps to initialize:

### 1. Check Existing Configuration
- Check if `./code-platform-config.json` exists:
  ```bash
  ls -la code-platform-config.json
  ```
- If exists, use it directly; otherwise proceed with initialization.

### 2. Get Repository Information
- Check if current directory is a git repository:
  ```bash
  git remote get-url origin
  ```
- Parse the URL to extract owner and repo:
  - SSH: `git@host:owner/repo.git`
  - HTTPS: `https://host/owner/repo`

### 3. Detect Platform
- Auto-detect platform from remote URL:
  - `atomgit.com` or `gitcode.com` → `gitcode`
  - `github.com` → `github`
  - `gitlab.com` → `gitlab`

### 4. Collect Token
- Ask user for personal access token:
  - For GitCode: Create token at https://gitcode.com/profile/token with 'api' scope
  - For GitHub: Create token at https://github.com/settings/tokens with 'repo' scope

### 5. Initialize Configuration
- Run the init command (auto-detects fork/non-fork):
  ```bash
  node skills/code-platform/scripts/platform/bin/platform-api.js init \
    --token "your-token" \
    --owner "owner-name" \
    --repo "repo-name" \
    --platform gitcode
  ```
- Add `code-platform-config.json` to `.gitignore`

### Fork Detection
The init command automatically detects whether the repository is a fork:
- **Fork mode**: Config includes `upstream.owner` and `upstream.repo`
- **Non-fork mode**: Config is simpler without upstream info

### Configuration File Structure

**Fork Repository:**
```json
{
  "token": "...",
  "owner": "fork-owner",
  "repo": "fork-repo",
  "platformType": "gitcode",
  "isFork": true,
  "upstream": {
    "owner": "upstream-owner",
    "repo": "upstream-repo"
  },
  "defaultBranch": "main",
  "upstreamDefaultBranch": "main"
}
```

**Non-fork Repository:**
```json
{
  "token": "...",
  "owner": "owner",
  "repo": "repo",
  "platformType": "gitcode",
  "isFork": false,
  "defaultBranch": "main"
}
```