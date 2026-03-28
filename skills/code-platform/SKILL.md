---
name: code-platform
description: 通用代码仓平台API操作工具，支持GitCode/AtomGit/GitLab等平台的Issue和PR管理
---

# Code Platform

通用代码仓平台API操作工具，支持GitCode/AtomGit等平台的Issue和PR管理。

## When to Use

使用此skill进行：
- Issue创建、查询、更新、认领
- PR创建、查询、更新
- 代码仓数据的自动化扫描和汇总

**重要**: 所有API操作必须使用 `platform-api.js`，禁止使用curl或gh命令。

## 功能介绍

### 配置

配置文件: `./code-platform-config.json`

```json
{
  "token": "your-platform-token",
  "owner": "owner-name",
  "repo": "repository-name",
  "platformType": "gitcode"
}
```

### Issue操作

```bash
# 创建Issue
platform-api create-issue --title "标题" --description "描述"

# 查询Issue详情
platform-api get-issue --id 123

# 认领Issue（分配给自己）
platform-api claim-issue --id 123

# 更新Issue
platform-api update-issue --id 123 --title "新标题" --body "新内容"

# 列出Issue
platform-api list-issues --state open
```

### PR操作

```bash
# 创建PR
platform-api create-pr --title "PR标题" --description "描述" --source-branch "分支名" --target-branch "main"

# 更新PR
platform-api update-pr --id 123 --title "新标题"

# 列出PR
platform-api list-prs --state open
```

### 完整命令列表

| 命令 | 说明 |
|------|------|
| `create-issue` | 创建新Issue |
| `get-issue` | 获取Issue详情 |
| `claim-issue` | 认领Issue（分配给fork.owner） |
| `update-issue` | 更新Issue |
| `list-issues` | 列出Issue |
| `create-pr` | 创建PR |
| `update-pr` | 更新PR |
| `list-prs` | 列出PR |

查看完整帮助: `platform-api --help`