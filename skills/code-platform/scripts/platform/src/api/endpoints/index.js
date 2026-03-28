/**
 * API端点模块入口
 */

const IssueAPI = require('./issues');
const PullRequestAPI = require('./pull-requests');

module.exports = {
  IssueAPI,
  PullRequestAPI
};