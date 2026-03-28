/**
 * 创建Issue命令
 */

const BaseCommand = require('./base');
const logger = require('../../utils/logger');
const CodebaseSyncService = require('../../modules/codebase-sync');

/**
 * 创建Issue命令
 */
class CreateIssueCommand extends BaseCommand {
  /**
   * 执行命令
   * @param {Object} options - 命令选项
   * @returns {Promise<void>}
   */
  async execute(options) {
    await this.init();

    try {
      const syncService = new CodebaseSyncService(this.configManager.get());
      
      if (syncService.shouldSyncOnCreate()) {
        if (!this.options.quiet) {
          this.info('Syncing with upstream main branch...');
        }
        
        const syncResult = await syncService.syncUpstreamMain();
        
        if (!syncResult.success && !syncResult.skipped) {
          this.warn(`Codebase sync failed: ${syncResult.error}. Proceeding anyway.`);
        } else if (syncResult.success && !syncResult.skipped) {
          if (!this.options.quiet) {
            this.info('Codebase synced successfully.');
          }
        }
      }

      // Prepare Issue data
      const issueData = {
        title: options.title,
        body: options.description || 'No description',
      };

      if (!this.options.quiet) {
        this.info('Creating Issue...', { title: issueData.title });
      }

      const issue = await this.api.issues.create(issueData);

      this.success(`Issue created successfully: #${issue.number} - ${issue.title}`, issue);

      if (!this.options.quiet && this.options.verbose) {
        console.log(this.formatOutput(issue));
      }

      return issue;
    } catch (error) {
      this.error('Failed to create Issue', error);
      throw error;
    }
  }
}

module.exports = CreateIssueCommand;
