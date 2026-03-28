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
| `create-issue` | Create new Issue |
| `get-issue` | Get Issue details |
| `claim-issue` | Claim Issue (assign to fork.owner) |
| `update-issue` | Update Issue |
| `list-issues` | List Issues |
| `create-pr` | Create PR |
| `update-pr` | Update PR |
| `list-prs` | List PRs |

Full help: `platform-api --help`