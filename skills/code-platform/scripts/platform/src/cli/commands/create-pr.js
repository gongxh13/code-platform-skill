/**
 * 创建Pull Request命令
 */

const BaseCommand = require('./base');

/**
 * 创建Pull Request命令
 */
class CreatePrCommand extends BaseCommand {
  /**
   * 执行命令
   * @param {Object} options - 命令选项
   * @returns {Promise<void>}
   */
  async execute(options) {
    await this.init();

    try {
      const prDescription = options.description || '';
      
      const coAuthoredBy = 'co-authored-by ADT(Agent-Dev-Team)';
      const finalPrDescription = prDescription ? `${prDescription}\n\n${coAuthoredBy}` : coAuthoredBy;
      
      if (options.sourceBranch && options.sourceBranch.includes(':')) {
        this.error('Invalid source branch format', new Error('Do not include username prefix. Use --source-branch feature/my-feature instead of --source-branch username:feature/my-feature. The script will auto-handle fork configuration.'));
        throw new Error('Invalid source branch format: please use branch name without username prefix');
      }

      let head = options.sourceBranch;
      const forkOwner = this.configManager.get('forkOwner');

      if (forkOwner && head && !head.includes(':')) {
        const originalHead = head;
        head = `${forkOwner}:${head}`;
        this.info(`Fork configuration detected, auto-converting head parameter: "${originalHead}" → "${head}"`);
      }

      const prData = {
        title: options.title,
        body: finalPrDescription,
        head: head,
        base: options.targetBranch,
        labels: this.parseCommaSeparated(options.labels),
        draft: options.draft || false
      };

      if (!this.options.quiet) {
        this.info('Creating Pull Request...', {
          title: prData.title,
          head: prData.head,
          base: prData.base,
          body_length: prData.body ? prData.body.length : 0
        });
      }

      const pr = await this.api.pullRequests.create(prData);

      if (options.issue) {
        try {
          await this.api.pullRequests.linkIssue(pr.number, parseInt(options.issue, 10));
        } catch (linkError) {
          console.warn('[WARN] Failed to link issue:', linkError.message);
        }
      }

      if (!this.options.quiet) {
        this.info('DEBUG: API response received', { 
          pr_response: JSON.stringify(pr, null, 2)
        });
        this.info('PR creation response:', { pr: JSON.stringify(pr) });
      }

      this.success(`Pull Request created successfully: #${pr.number || pr.id || 'N/A'} - ${pr.title || 'N/A'}`, pr);

      if (!this.options.quiet && this.options.verbose) {
        console.log(this.formatOutput(pr));
      }

      return pr;
    } catch (error) {
      this.error('Failed to create Pull Request', error);
      throw error;
    }
  }
}

module.exports = CreatePrCommand;