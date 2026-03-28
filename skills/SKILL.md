---
name: feature-management
description: Feature claim and management system to prevent duplicate work, track development progress, and manage platform issues with documentation.
---

# Feature Management

Lightweight feature claim system that prevents duplicate work and tracks development progress from claim to completion with issue management.

## Language Detection and Response

### Language Detection
- Automatically detect the language of user input

### Response Language Matching
- Respond in the same language as the user input
- If the user writes in Chinese, you MUST reply in Chinese.
- If the user writes in English, you MUST reply in English.

## When to Use

Use this skill when:
- Claiming a new feature to prevent duplicate work
- Submitting completed work with documentation
- Creating or updating platform issues for feature tracking
- Managing feature status and documentation

## Important: API Operations Must Use platform-api.js

### Prohibition

**DO NOT use curl** for any platform API operations. Direct curl commands are not reliable due to:
- Manual authentication header management
- Lack of proper error handling
- No platform detection
- Inconsistent response parsing
- Potential credential exposure in command history

### Correct Approach

**Always use the provided platform-api.js script** for all API operations. See [platform-api.md](references/platform-api.md) for available commands and usage.

### Examples

#### ❌ Incorrect (Do NOT use)

```bash
# Never use curl for API operations
curl -X POST "https://api.atomgit.com/api/v5/repos/owner/repo/issues" \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Issue", "body": "Issue description"}'

# Don't try to manually construct API calls
curl -s "https://api.atomgit.com/api/v5/repos/owner/repo/issues/123"
```

#### ✅ Correct (Use platform-api.js)

```bash
# Create a new issue
platform-api create-issue --title "New Issue" --description "Issue description"

# Get issue details
platform-api get-issue --id 123

# Claim an issue
platform-api claim-issue --id 123

# Update an issue
platform-api update-issue --id 123 --title "Updated Title"

# Create a pull request
platform-api create-pr --title "Feature PR" --description "PR description" --source-branch "feature-branch" --target-branch "main"

# Or use the full path
node skills/feature-management/scripts/platform/bin/platform-api.js create-issue --title "New Issue"
```

### Why platform-api.js?

- **Automatic authentication**: Handles token management automatically
- **Platform detection**: Works with GitHub, GitLab, Gitee, and other platforms
- **Error handling**: Proper error messages and retry logic
- **Consistent output**: Standardized JSON output for parsing

### Also: DO NOT use gh CLI

**DO NOT use the `gh` command-line tool** for any platform API operations. Even though `gh` is a legitimate GitHub CLI, using it directly has the same problems as curl:
- Platform-specific (primarily designed for GitHub, not GitCode/GitLab/Gitee)
- Manual token configuration required
- Inconsistent behavior across different platforms
- No unified interface for multi-platform operations

**Always use platform-api.js** for all API operations, including:
- Creating/reading/updating issues
- Claiming issues
- Creating/updating pull requests
- Listing issues and PRs

## Workflows

### 1. Check Project Configuration

**Purpose**: Verify that the project is properly configured before proceeding with any feature management operations.

**Step 1: Check Project Configuration**
- Check if `.agentdev/config.json` file exists and is readable in current working directory
  - **Important**: Use `ls -la .agentdev/config.json` or `test -f .agentdev/config.json` command. DO NOT use Glob tool, as it may fail to match hidden directories starting with dot.
- If missing or unreadable, respond: "Project configuration not found. Please initialize project configuration first using `/adt:init` or `/using-adt init` command."

### 2. Determine Task Scenario

**Purpose**: Analyze user input to identify which feature management task is being requested.

**Step 1: Intent Detection**
- **Issue Management**: Keywords like "create issue", "update issue", "新建issue", "修改issue", "创建需求", "修改需求", "create requirement", "update requirement"
- **Feature Claim**: Keywords like "claim", "develop", "work on", "implement", "build", "create feature", "认领", "开发", "实现", "构建"
- **Feature Completion**: Keywords like "complete", "finish", "submit", "done", "mark as completed", "完成", "提交", "结束", "标记完成"
- **PR Creation**: Keywords like "create PR", "submit PR", "pull request", "创建PR", "提交PR"
- **Phase Reporting**: Keywords like "phase report", "report phase", "design phase", "development phase", "testing phase", "阶段上报", "design complete", "development complete", "testing complete", "report design start", "report development complete"

**Step 2: Scenario Routing**
- If intent matches feature management capabilities, proceed to appropriate workflow
- If intent is outside feature management scope, respond: "This request is not supported by feature management. Please use appropriate skill for [task description]."

### Case 1: Issue Management

**Purpose**: Create or update platform issues for feature requirements tracking.

**Typical User Input**:
- "创建issue: 用户认证系统" (create issue: user authentication system)
- "修改issue #123: 更新需求" (update issue #123: update requirements)
- "创建需求: 用户管理模块" (create requirement: user management module)
- "修改需求: 增加API文档" (update requirement: add API documentation)

**Step 1: Get Existing Issue (Update Only)**
- For update requests, use [platform-api.md](references/platform-api.md) to fetch current issue content
- Parse issue ID from input (#123 format or URL)
- Retrieve title, description, status via platform API
- Analyze differences between current content and requested changes

**Step 2: Requirement Analysis & Clarification**
- Analyze user request and project context to understand requirements
- Ask clarifying questions for ambiguous areas
- Use interactive Q&A to ensure complete understanding

**Step 3: Generate Requirement Document**
- Create structured document using [feature-template.md](references/feature-template.md)
- **Template sections**:
  - 1. Background & Value
  - 2. Requirements Details
  - 3. Solution Approach
  - 4. Acceptance Criteria
- Fill template with clarified requirements
- Ensure content is complete, clear, and actionable

**Step 4: User Review & Confirmation**
- Show generated document to user
- Ask: "Is this accurate?" with options:
  - "Confirm and proceed"
  - "Modify specific sections"
  - "Cancel operation"
- If modifications requested, adjust content based on feedback

**Step 5: Execute Platform Operation**
- After user confirmation, use [platform-api.md](references/platform-api.md) to create/update issue
- **Create issue**:
  - Use template-generated content
  - Title format: `[feature] Feature Name`
- **Update issue**:
  - Merge existing and updated content
  - Maintain clear change history
  - Update status if needed
- Extract returned Issue ID and URL

**Step 6: Validate Created/Updated Issue**
- Check that the issue was created/updated successfully
- Verify the issue has a meaningful description (not empty or placeholder)
- If description is insufficient, prompt user to update it
- Ensure title follows proper convention for features

**Step 7: Completion & Next Steps**
- Confirm operation success
- Display issue link

### Case 2: Feature Claim

**Purpose**: Start working on a new feature by claiming it, creating a development branch, and setting up tracking.

**Typical User Input**:
- `/adt:feature 认领 <URL>` (e.g., `/adt:feature 认领 https://atomgit.com/owner/repo/issues/123`)
- `/adt:feature 认领 <feature name>` (e.g., `/adt:feature 认领 user-authentication-system`)
- "认领用户认证系统功能" (claim user authentication system feature)

**Step 1: Identify Issue from URL or Name**
- **For URL input**: Extract issue ID from URL, use platform API ([platform-api.md](references/platform-api.md)) to query issue details
- **For name input**: Search platform issues by title/description to find matching issue using platform API
- Determine issue link and metadata using platform API

**Step 2: Check if Issue Already Claimed**
- Search all `features/*/feature.json` files for `platformIssue.web_url` matching the issue URL
- If already claimed, respond: "This issue has already been claimed by [username] at [timestamp]. Please choose another issue."
- If not claimed, proceed to next step

**Step 3: Claim Issue**
- Use the dedicated `claim-issue` command from [platform-api.md](references/platform-api.md) to assign the issue
- The issue will be assigned to the configured `fork.owner` from project configuration
- If no `fork.owner` is configured, the claim operation will fail with an error
- Verify assignee update was successful by checking issue details

**Step 4: Create Feature Branch**
- Verify git repository status and clean working directory
- Extract feature name from issue title and normalize to kebab-case
- Create branch: `git checkout -b feature/{normalized-name}`

**Step 5: Create Worktree (Optional)**
- Check if worktree manager is enabled in configuration
- If enabled, create worktree for parallel development:
  ```bash
  node skills/adt/worktree-manager/scripts/worktree-manager.js create {normalized-name} feature/{normalized-name}
  ```
- Record worktree path for later use
- If worktree creation fails, log warning but continue with normal branch workflow

**Step 6: Create Feature Structure**
- Create folder: `features/feature-{normalized-name}/`
  - Create `feature.json` with the following structure:
  ```json
  {
    "name": "feature-name",
    "title": "Human Readable Title from Issue",
    "status": "claimed",
    "claimedBy": "username",
    "claimedAt": "2024-03-05T10:30:00Z",
    "completedAt": "",
    "worktree": {
      "path": "worktrees/feature-feature-name",
      "enabled": true
    },
    "platformIssue": {
      "id": 123,
      "web_url": "https://atomgit.com/owner/repo/issues/123",
      "title": "Issue Title",
      "state": "open"
    },
    "documentation": {
      "requirements": [],
      "design": [],
      "tests": [],
      "pr": [],
      "deployment": [],
      "notes": ""
    }
  }
  ```

**Step 7: Save Issue Content**
- Use platform API ([platform-api.md](references/platform-api.md)) to fetch issue content and save as `issue.md` in feature folder
- Execute the command:
  ```bash
  node skills/feature-management/scripts/platform/bin/platform-api.js get-issue --id {issue-number} --output-file features/feature-{normalized-name}/issue.md
  ```
- Verify the issue.md file was created successfully

**Step 8: Commit Feature Directory**
- Add the newly created feature directory to git staging:
  ```bash
  git add features/feature-{normalized-name}/
  ```
  - Create a commit with descriptive message:
  ```bash
  git commit -m "feat: claim feature {feature-name}

  - Create feature structure for {feature-title}
  - Add feature.json with initial metadata
  - Save issue content as issue.md
  - Claimed by {username} at {timestamp}

  co-authored-by ADT(Agent-Dev-Team)"
  ```
- Verify commit was successful:
  ```bash
  git log --oneline -1
  ```
- Push the feature branch to remote repository:
  ```bash
  git push -u origin feature/{normalized-name}
  ```
- Verify push was successful:
  ```bash
  git status
  ```
- If commit fails due to pre-commit hooks, fix issues and retry

### Case 3: Feature Completion

**Purpose**: Mark a feature as completed with proper documentation and validation.

**Typical User Input**:
- "完成用户认证功能" (complete user authentication feature)
- "提交API文档和测试报告" (submit API documentation and test report)
- "标记用户管理模块为已完成" (mark user management module as completed)
- "完成 user-authentication-system" (complete user-authentication-system)
- "提交 user-management-api" (submit user-management-api)
- "完成 feature-name" (complete feature-name)
- "提交 feature-name" (submit feature-name)

**Step 1: Check Feature Directory Exists**
- Check if `features/feature-{feature-name}/` directory exists for the requested feature
- If directory doesn't exist, respond: "Feature '{feature-name}' not found. Please check the feature name or claim the feature first."
- If directory exists, proceed to next step

**Step 2: Update Documentation Links**
- Update `feature.json` in the feature directory with provided documentation links
- **Important**: Do NOT update PR links at this stage - wait until PR is successfully created
- Update other documentation types: requirements, design, tests, deployment, notes
- Ensure links are accessible and relevant to the feature
- Validate documentation meets minimum requirements (at least one non-PR document)

**Step 3: Commit and Push Changes**
- Check current git status for uncommitted changes related to the feature
- Add all relevant changes to staging:
  ```bash
  git add features/feature-{feature-name}/
  git add [other related files]
  ```
  - Create commit with descriptive message:
  ```bash
  git commit -m "feat: complete feature {feature-name}

  - Update documentation links
  - Add {documentation-types}
  - Prepare for PR creation

  co-authored-by ADT(Agent-Dev-Team)"
  ```
- Push changes to remote repository:
  ```bash
  git push origin feature/{feature-name}
  ```


**Step 4: Run Verification Before PR**
- Use Skill tool to invoke `pr-quality-check` skill
- This ensures all code quality checks, linting, tests, and completeness verification pass before creating PR
- Wait for verification to complete successfully before proceeding

**Step 5: Create Pull Request**
- Generate a clear PR description based on the feature changes, using appropriate template from [templates/](templates/) directory for structure
- Use [platform-api.md](references/platform-api.md) to create PR from current feature branch with the generated description
- Extract PR URL and number from response

**Step 6: Update PR Information**
- After successful PR creation, update `feature.json` with PR link:
  ```json
  "documentation": {
    "pr": [
      {
        "title": "Pull Request #{pr-number}",
        "url": "{pr-url}",
        "createdAt": "{timestamp}"
      }
    ]
  }
  ```
- Also update feature status to "completed" and set `completedAt` timestamp

**Step 7: Final Commit and Push**
- Commit updated `feature.json` with PR information:
  ```bash
  git add features/feature-{feature-name}/feature.json
  git commit -m "docs: update feature metadata with PR link #{pr-number}

  co-authored-by ADT(Agent-Dev-Team)"
  ```
- Push final changes to remote:
  ```bash
  git push origin feature/{feature-name}
  ```
- Confirm all changes are successfully pushed and PR is created

**Step 8: Cleanup Worktree (Optional)**
- Check if worktree was created for this feature (check `feature.json` for worktree.path)
- If worktree exists and cleanup is enabled in configuration:
  ```bash
  node skills/adt/worktree-manager/scripts/worktree-manager.js remove {feature-name} --remove-branch
  ```
- If worktree cleanup fails, log warning but do not fail the completion feature
- Update `feature.json` to remove worktree information after successful cleanup

### Case 4: PR Creation

**Purpose**: Create Pull Requests for features with existing local modifications, handling both documented and undocumented changes.

**Typical User Input**:
- "创建PR: 用户认证系统" (create PR: user authentication system)
- "提交拉取请求: API网关" (submit pull request: API gateway)
- "为数据库迁移创建PR" (create PR for database migration)
- "创建PR" (create PR) - for current branch changes
- "提交PR" (submit PR) - for current feature

**Step 1: Check Current Branch and Changes**
- Identify current git branch: `git branch --show-current`
- Check for uncommitted changes: `git status`
- Determine if changes are related to an existing feature or new work
- If no uncommitted changes, check last commit for feature context

**Step 2: Check for Feature Association**
- **Scenario A: Changes in feature directory**:
  - If changes are in `features/feature-*/` directory, identify the feature
  - Check if corresponding `feature.json` exists
  - If exists, this is a documented feature update
- **Scenario B: General code changes**:
  - If changes are outside feature directories
  - Check git log for recent feature-related commits
  - Determine if this is continuation of an existing feature or new work

**Step 3: Handle Feature Documentation Updates**
- **If feature directory exists with changes**:
  - Update `feature.json` with current documentation links
  - Ensure PR links are not duplicated
  - Add any new documentation provided by user
  - Commit feature documentation updates:
    ```bash
    git add features/feature-{feature-name}/feature.json
    git commit -m "docs: update feature documentation for PR"
    ```
- **If no feature directory exists**:
  - Check if current branch is a feature branch (starts with `feature/`)
  - **If not on feature branch**:
    - Extract feature name from changes or user input
    - Normalize to kebab-case: `{feature-name}`
    - Create feature branch:
      ```bash
      git checkout -b feature/{feature-name}
      ```
  - **If already on feature branch**:
    - Extract feature name from branch name (remove `feature/` prefix)
    - Use extracted name for PR context
  - Proceed with PR creation without feature documentation

**Step 4: Commit and Push Current Changes**
- Ensure all relevant changes are staged:
  ```bash
  git add .
  ```
  - Create commit with descriptive message:
  ```bash
  git commit -m "feat: {brief-description-of-changes}

  - [List key changes]
  - Related to feature: {feature-name} (if applicable)

  co-authored-by ADT(Agent-Dev-Team)"
  ```
- Push changes to remote:
  ```bash
  git push origin {current-branch}
  ```

**Step 5: Run Verification Before PR**
- Use Skill tool to invoke `pr-quality-check` skill
- This ensures all code quality checks, linting, tests, and completeness verification pass before creating PR
- Wait for verification to complete successfully before proceeding

**Step 6: Generate PR Description and Create Pull Request**
- Generate a clear PR description based on the changes, using appropriate template from [templates/](templates/) directory for structure
- Create PR using [platform-api.md](references/platform-api.md) with the generated description

**Step 7: Update Feature Documentation (if applicable)**
- If feature exists and PR was created:
  - Update `feature.json` with PR link:
    ```json
    "documentation": {
      "pr": [
        {
          "title": "Pull Request #{pr-number}",
          "url": "{pr-url}",
          "createdAt": "{timestamp}"
        }
      ]
    }
    ```
  - Commit PR link update:
    ```bash
    git add features/feature-{feature-name}/feature.json
    git commit -m "docs: add PR link #{pr-number} to feature documentation

    co-authored-by ADT(Agent-Dev-Team)"
    git push origin {current-branch}
    ```

**Step 8: Completion**
- Confirm PR creation success
- Display PR link
- Provide summary of what was done:
  - Feature documentation updated (if applicable)
  - Changes committed and pushed
  - PR description generated by AI referencing template structure

### Case 5: Phase Reporting

**Purpose**: Report phase status (start/complete) to visualization dashboard. Git commands should be executed separately by the model.

**Typical User Input**:
- "Report design phase start"
- "Report development phase complete"
- "Report testing phase completion"
- "design阶段开始上报"
- "development阶段完成上报"

**Step 1: Parse Request**
Extract:
- Phase name: design, development, or testing
- Status: start or complete (default: complete)
- Issue number for reporting

**Step 2: Execute Phase Report**
Use the phase-report command via platform-api:
```bash
node skills/feature-management/scripts/platform/bin/platform-api.js phase-report --phase <phase> --issue <issue-number> [--status start|complete]
```

**Step 3: Handle Response**
- If success: Confirm phase event was reported to dashboard
- If error: Report the error and suggest retry

**Examples**:
- Report design start: `phase-report --phase design --issue 68 --status start`
- Report design complete: `phase-report --phase design --issue 68`
- Report development complete: `phase-report --phase development --issue 68`
- Report testing complete: `phase-report --phase testing --issue 68`

**Important**: Git commands should be executed separately by the model using standard git commands. The phase-report command only reports status to the dashboard and does not execute any git operations.
