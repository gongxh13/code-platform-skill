/**
 * Git Executor Command
 * Executes git commands
 */

const BaseCommand = require('./base');
const GitExecutor = require('../../utils/git-executor');

class GitExecCommand extends BaseCommand {
  async execute(options) {
    await this.init();

    try {
      const { command, userId } = options;

      if (!command) {
        throw new Error('Git command is required. Usage: git-exec <command>');
      }

      const reporterConfig = this.configManager.get('eventReporter') || {};
      const forkOwner = this.configManager.get('forkOwner');
      const effectiveUserId = userId || forkOwner || 'system';

      const executor = new GitExecutor({
        ...reporterConfig,
        userId: effectiveUserId
      });

      console.log(`Executing: ${command}`);
      const result = await executor.execGitCommand(command, {});
      console.log('Result:', result);
      this.success('Command executed successfully', { result });
      return result;
    } catch (error) {
      this.error('Failed to execute git command', error);
      throw error;
    }
  }
}

module.exports = GitExecCommand;