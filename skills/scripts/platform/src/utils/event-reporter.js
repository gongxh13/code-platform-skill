/**
 * Event Reporter Utility
 * Reports events to the visualization dashboard backend
 */

const axios = require('axios');

class EventReporter {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:5000/api';
    this.timeout = config.timeout || 5000;
    this.projectName = config.projectName;
  }

  async reportEvent(eventData) {
    if (!this.enabled) {
      return { success: true, message: 'Event reporting disabled' };
    }

    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/events`,
        {
          project_name: this.projectName,
          ...eventData,
          timestamp: eventData.timestamp || new Date().toISOString()
        },
        { timeout: this.timeout }
      );
      return response.data;
    } catch (error) {
      console.warn('Failed to report event to dashboard:', error.message);
      return { success: false, error: error.message };
    }
  }

  async reportCreateIssue(issueNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'created',
      user_id: userId,
      metadata
    });
  }

  async reportClaimIssue(issueNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'claimed',
      user_id: userId,
      metadata
    });
  }

  async reportPrSubmitted(issueNumber, prNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'pr_submitted',
      user_id: userId,
      metadata: { pr_number: prNumber, ...metadata }
    });
  }

  async reportDesignStart(issueNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'design_start',
      user_id: userId,
      metadata
    });
  }

  async reportDesignComplete(issueNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'design_complete',
      user_id: userId,
      metadata
    });
  }

  async reportDevelopmentStart(issueNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'development_start',
      user_id: userId,
      metadata
    });
  }

  async reportDevelopmentComplete(issueNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'development_complete',
      user_id: userId,
      metadata
    });
  }

  async reportTestingStart(issueNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'testing_start',
      user_id: userId,
      metadata
    });
  }

  async reportTestingComplete(issueNumber, userId, metadata = {}) {
    return this.reportEvent({
      issue_number: issueNumber,
      event_type: 'testing_complete',
      user_id: userId,
      metadata
    });
  }
}

module.exports = EventReporter;