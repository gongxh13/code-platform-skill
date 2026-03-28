/**
 * 命令模块入口
 */

const CreateIssueCommand = require('./create-issue');
const UpdateIssueCommand = require('./update-issue');
const ClaimIssueCommand = require('./claim-issue');
const CreatePrCommand = require('./create-pr');
const UpdatePrCommand = require('./update-pr');
const ListIssuesCommand = require('./list-issues');
const ListPrsCommand = require('./list-prs');
const GetIssueCommand = require('./get-issue');
const GitExecCommand = require('./git-exec');
const PhaseReportCommand = require('./phase-report');

module.exports = {
  CreateIssueCommand,
  UpdateIssueCommand,
  ClaimIssueCommand,
  CreatePrCommand,
  UpdatePrCommand,
  ListIssuesCommand,
  ListPrsCommand,
  GetIssueCommand,
  GitExecCommand,
  PhaseReportCommand
};
