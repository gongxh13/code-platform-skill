/**
 * 认领Issue命令 - 专门用于给Issue指派用户
 */

const BaseCommand = require('./base');
const EventReporter = require('../../utils/event-reporter');
const CodebaseSyncService = require('../../modules/codebase-sync');
const { withRetry, DEFAULT_RETRY_CONFIG } = require('../../utils/retry');

/**
 * 认领Issue命令
 */
class ClaimIssueCommand extends BaseCommand {
  /**
   * 执行命令
   * @param {string} issueNumber - Issue编号
   * @param {Object} options - 命令选项
   * @returns {Promise<void>}
   */
  async execute(issueNumber, options) {
    await this.init();

    const number = parseInt(issueNumber, 10);
    if (isNaN(number)) {
      throw new Error('Issue number must be a number');
    }

    const assignee = this.configManager.get('forkOwner');
    if (!assignee) {
      throw new Error('No forkOwner configured in config. Please configure forkOwner in code-platform-config.json');
    }

    const reporterConfig = this.configManager.get('eventReporter') || {};
    const reporter = new EventReporter({
      ...reporterConfig,
      projectName: this.configManager.get('owner') + '/' + this.configManager.get('repository')
    });

    let issue = null;
    let claimSuccess = false;
    let claimError = null;

    try {
      const syncService = new CodebaseSyncService(this.configManager.get());
      
      if (syncService.shouldSyncOnClaim()) {
        if (!this.options.quiet) {
          this.info('Syncing with upstream main branch...');
        }
        
        const syncResult = await syncService.syncUpstreamMain();
        
        if (!syncResult.success && !syncResult.skipped) {
          this.warn('Codebase sync failed: ' + syncResult.error + '. Proceeding anyway.');
        } else if (syncResult.success && !syncResult.skipped) {
          if (!this.options.quiet) {
            this.info('Codebase synced successfully.');
          }
        }
      }

      const claimData = {
        assignee: assignee
      };

      if (!this.options.quiet) {
        this.info('Claiming Issue #' + number + ' for ' + assignee + '...');
      }

      const retryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 2,
        shouldRetry: (error) => {
          if (error.response) {
            const status = error.response.status;
            return status >= 500 || status === 429 || status === 403 || status === 404;
          }
          return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
        }
      };

      issue = await withRetry(
        () => this.api.issues.update(number, claimData),
        retryConfig
      );

      claimSuccess = true;
      this.success('Issue #' + number + ' claimed successfully for ' + assignee, issue);

      if (!this.options.quiet && this.options.verbose) {
        console.log(this.formatOutput(issue));
      }
    } catch (error) {
      claimError = error;
      this.warn('Failed to claim Issue #' + number + ' after retries: ' + error.message);
    }

    try {
      await reporter.reportClaimIssue(number, assignee, {
        issue_title: issue?.title || null,
        issue_url: issue?.html_url || null,
        claim_success: claimSuccess,
        error_message: claimError ? claimError.message : null
      });
    } catch (reportError) {
      this.warn('Failed to report claim event to platform: ' + reportError.message);
    }

    if (!claimSuccess) {
      throw claimError;
    }

    return issue;
  }
}

module.exports = ClaimIssueCommand;