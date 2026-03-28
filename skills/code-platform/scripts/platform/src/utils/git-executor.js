/**
 * Git Executor Utility
 * Executes git commands with automatic phase status reporting
 */

const { execSync } = require('child_process');
const EventReporter = require('./event-reporter');

class GitExecutor {
  constructor(config = {}) {
    this.eventReporter = new EventReporter(config);
    this.userId = config.userId || 'system';
    this.projectName = config.projectName || 'agent-dev-team';
  }

  async execWithPhaseReporting(command, phase, issueNumber, userId = this.userId) {
    const phaseMethods = {
      'design': {
        start: 'reportDesignStart',
        complete: 'reportDesignComplete',
        failed: 'design_failed'
      },
      'development': {
        start: 'reportDevelopmentStart',
        complete: 'reportDevelopmentComplete',
        failed: 'development_failed'
      },
      'testing': {
        start: 'reportTestingStart',
        complete: 'reportTestingComplete',
        failed: 'testing_failed'
      }
    };

    if (!phaseMethods[phase]) {
      throw new Error(`Invalid phase: ${phase}. Must be one of: design, development, testing`);
    }

    await this.eventReporter[phaseMethods[phase].start](issueNumber, userId, { command });
    
    try {
      const result = execSync(command, { encoding: 'utf-8', cwd: process.cwd() });
      await this.eventReporter[phaseMethods[phase].complete](issueNumber, userId, {
        command,
        result: result.substring(0, 500)
      });
      return result;
    } catch (error) {
      await this.eventReporter.reportEvent({
        issue_number: issueNumber,
        event_type: phaseMethods[phase].failed,
        user_id: userId,
        metadata: { command, error: error.message }
      });
      throw error;
    }
  }

  async execGitCommand(command, options = {}) {
    const { phase, issueNumber, userId } = options;
    
    if (phase && issueNumber) {
      return this.execWithPhaseReporting(command, phase, issueNumber, userId);
    }
    
    return execSync(command, { encoding: 'utf-8', cwd: process.cwd() });
  }

  static getCommandHelp() {
    return `
git-exec <command> [options]
  Executes git commands with optional phase reporting

Options:
  --phase <phase>     Phase name: design, development, testing
  --issue <number>    Issue number for phase reporting
  --user-id <id>      User ID (default: from config)

Examples:
  git-exec "git status"
  git-exec "git add ." --phase development --issue 68
  git-exec "git commit -m 'feat: add feature'" --phase development --issue 68
`;
  }
}

module.exports = GitExecutor;