/**
 * Git Executor Utility
 * Executes git commands
 */

const { execSync } = require('child_process');

class GitExecutor {
  constructor(config = {}) {
    this.userId = config.userId || 'system';
    this.projectName = config.projectName || 'agent-dev-team';
  }

  execGitCommand(command, options = {}) {
    return execSync(command, { encoding: 'utf-8', cwd: process.cwd() });
  }

  static getCommandHelp() {
    return `
git-exec <command> [options]
  Executes git commands

Options:
  --phase <phase>     (deprecated, ignored)
  --issue <number>    (deprecated, ignored)
  --user-id <id>      (deprecated, ignored)

Examples:
  git-exec "git status"
  git-exec "git add ."
  git-exec "git commit -m 'feat: add feature'"
`;
  }
}

module.exports = GitExecutor;