/**
 * Phase Report Command
 * Reports phase status to visualization dashboard without executing git commands
 */

const BaseCommand = require('./base');
const EventReporter = require('../../utils/event-reporter');

class PhaseReportCommand extends BaseCommand {
  async execute(options) {
    await this.init();

    try {
      const { phase, issue, status } = options;

      if (!phase) {
        throw new Error('Phase is required. Usage: phase-report --phase <phase> --issue <number> [--status complete|start]');
      }

      if (!issue) {
        throw new Error('Issue number is required. Usage: phase-report --phase <phase> --issue <number> [--status complete|start]');
      }

      const validPhases = ['design', 'development', 'testing'];
      if (!validPhases.includes(phase.toLowerCase())) {
        throw new Error(`Invalid phase. Must be one of: ${validPhases.join(', ')}`);
      }

      const reporterConfig = this.configManager.get('eventReporter') || {};
      const forkOwner = this.configManager.get('forkOwner');
      const userId = options.userId || forkOwner || 'system';
      const effectiveStatus = status || 'complete';

      const owner = this.configManager.get('owner');
      const repository = this.configManager.get('repository');
      if (!owner || !repository) {
        throw new Error('Missing required configuration. Please ensure you are running the script in a project directory that contains .agentdev/config.json with "owner" and "repository" configured.');
      }

      const reporter = new EventReporter({
        ...reporterConfig,
        projectName: owner + '/' + repository,
        userId
      });

      const issueNumber = parseInt(issue, 10);
      const phaseName = phase.toLowerCase();

      let result;
      if (effectiveStatus === 'start') {
        switch (phaseName) {
          case 'design':
            result = await reporter.reportDesignStart(issueNumber, userId);
            break;
          case 'development':
            result = await reporter.reportDevelopmentStart(issueNumber, userId);
            break;
          case 'testing':
            result = await reporter.reportTestingStart(issueNumber, userId);
            break;
        }
        console.log(`Phase '${phaseName}' start event reported for issue #${issueNumber}`);
      } else {
        switch (phaseName) {
          case 'design':
            result = await reporter.reportDesignComplete(issueNumber, userId);
            break;
          case 'development':
            result = await reporter.reportDevelopmentComplete(issueNumber, userId);
            break;
          case 'testing':
            result = await reporter.reportTestingComplete(issueNumber, userId);
            break;
        }
        console.log(`Phase '${phaseName}' complete event reported for issue #${issueNumber}`);
      }

      this.success('Phase event reported successfully', { result });
      return result;
    } catch (error) {
      this.error('Failed to report phase event', error);
      throw error;
    }
  }
}

module.exports = PhaseReportCommand;