/**
 * Command Line Interface Configuration - Multi-platform support
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { version } = require('../../package.json');

// Create main program
const program = new Command();

// Basic configuration
program
  .name('platform-api')
  .description('Platform API CLI Tool - Supports GitHub, GitCode, GitLab, etc.')
  .version(version)
  .option('-c, --config <path>', 'Config file path', './code-platform-config.json')
  .option('-p, --platform <platform>', 'Platform type (github/gitcode/gitlab)', 'gitcode')
  .option('--token <token>', 'API token (overrides config)')
  .option('-o, --owner <owner>', 'Repository owner (overrides config)')
  .option('-r, --repo <repository>', 'Repository name (overrides config)')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-d, --debug', 'Debug mode', false)
  .option('-s, --silent', 'Silent mode', false)
  .option('-q, --quiet', 'Quiet mode (minimal output)', true)
  .option('--no-quiet', 'Disable quiet mode (show all output)')
  .option('--no-color', 'Disable colored output', false)
  .option('--output <format>', 'Output format (text/json/table/concise)', 'concise')
  .option('--log-level <level>', 'Log level (error/warn/info/debug/verbose)', 'info')
  .option('--dry-run', 'Dry run mode (no API calls)', false);

// Create Issue command
program
  .command('create-issue')
  .description('Create a new Issue (does not automatically assign)')
  .requiredOption('-t, --title <title>', 'Issue title')
  .option('-d, --description <description>', 'Issue description (use heredoc for multi-line: --description "$(cat <<\'EOF\'\nmulti-line\ndescription\nEOF\n)")')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .action(async (options) => {
    try {
      const { CreateIssueCommand } = require('./commands');
      // 合并全局选项和子命令选项
      const mergedOptions = { ...program.opts(), ...options };
      const command = new CreateIssueCommand(mergedOptions);
      await command.execute(options);
    } catch (error) {
      console.error(chalk.red('✗ Creation failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Get single Issue command
program
  .command('get-issue [issueNumber]')
  .description('Get Issue details')
  .option('--id <issueNumber>', 'Issue number (alternative to positional argument)')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .option('--output-file <path>', 'Save issue content to markdown file')
  .action(async (issueNumber, options) => {
    try {
      const { GetIssueCommand } = require('./commands');
      // 合并全局选项和子命令选项
      const mergedOptions = { ...program.opts(), ...options };
      const command = new GetIssueCommand(mergedOptions);
      
      // 支持--id选项和位置参数
      const finalIssueNumber = options.id || issueNumber;
      if (!finalIssueNumber) {
        console.error(chalk.red('✗ Error:'), 'Issue number is required. Use --id <number> or provide as positional argument.');
        process.exit(1);
      }
      
      await command.execute(finalIssueNumber, options);
    } catch (error) {
      console.error(chalk.red('✗ Fetch failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Claim Issue command - specifically for assigning issues
program
  .command('claim-issue [issueNumber]')
  .description('Claim an Issue by assigning it to fork.owner from config')
  .option('--id <issueNumber>', 'Issue number (alternative to positional argument)')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .action(async (issueNumber, options) => {
    try {
      const { ClaimIssueCommand } = require('./commands');
      // 合并全局选项和子命令选项
      const mergedOptions = { ...program.opts(), ...options };
      const command = new ClaimIssueCommand(mergedOptions);
      
      // 支持--id选项和位置参数
      const finalIssueNumber = options.id || issueNumber;
      if (!finalIssueNumber) {
        console.error(chalk.red('✗ Error:'), 'Issue number is required. Use --id <number> or provide as positional argument.');
        process.exit(1);
      }
      
      await command.execute(finalIssueNumber, options);
    } catch (error) {
      console.error(chalk.red('✗ Claim failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Update Issue command
program
  .command('update-issue [issueNumber]')
  .description('Update an existing Issue (does not automatically assign)')
  .option('--id <issueNumber>', 'Issue number (alternative to positional argument)')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <description>', 'New description (use heredoc for multi-line: --description "$(cat <<\'EOF\'\nmulti-line\ndescription\nEOF\n)")')
  .option('-s, --state <state>', 'State (open/closed)')
  .option('-l, --labels <labels>', 'New label list, comma separated')
  .option('-a, --assignee <assignee>', 'Assignee username (optional, use empty string to clear assignee)')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .action(async (issueNumber, options) => {
    try {
      const { UpdateIssueCommand } = require('./commands');
      // 合并全局选项和子命令选项
      const mergedOptions = { ...program.opts(), ...options };
      const command = new UpdateIssueCommand(mergedOptions);
      
      // 支持--id选项和位置参数
      const finalIssueNumber = options.id || issueNumber;
      if (!finalIssueNumber) {
        console.error(chalk.red('✗ Error:'), 'Issue number is required. Use --id <number> or provide as positional argument.');
        process.exit(1);
      }
      
      await command.execute(finalIssueNumber, options);
    } catch (error) {
      console.error(chalk.red('✗ Update failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Phase Report command - Report phase status without executing git
program
  .command('phase-report')
  .description('Report phase status (start/complete) to visualization dashboard')
  .requiredOption('-p, --phase <phase>', 'Phase name: design, development, testing')
  .requiredOption('-i, --issue <number>', 'Issue number for phase reporting')
  .option('-s, --status <status>', 'Status: start or complete (default: complete)')
  .option('-u, --user-id <id>', 'User ID for reporting')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .action(async (options) => {
    try {
      const { PhaseReportCommand } = require('./commands');
      const commandInstance = new PhaseReportCommand({ ...program.opts(), ...options });
      await commandInstance.execute(options);
    } catch (error) {
      console.error(chalk.red('✗ Phase report failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Git Exec command (legacy - executes git but does NOT report phase)
program
  .command('git-exec')
  .description('[DEPRECATED] Execute git commands without phase reporting')
  .argument('<command>', 'Git command to execute (use quotes for multi-word commands)')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .action(async (command, options) => {
    try {
      const { GitExecCommand } = require('./commands');
      const commandInstance = new GitExecCommand({ ...program.opts(), ...options });
      await commandInstance.execute({ command, ...options });
    } catch (error) {
      console.error(chalk.red('✗ Execution failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Create Pull Request command
program
  .command('create-pr')
  .description('Create a Pull Request with template system')
  .requiredOption('--source-branch <branch>', 'Source branch')
  .requiredOption('--target-branch <branch>', 'Target branch')
  .requiredOption('-t, --title <title>', 'PR title')
  .requiredOption('-d, --description <description>', 'PR description (use heredoc for multi-line: --description "$(cat <<\'EOF\'\nmulti-line\ndescription\nEOF\n)")')
  .option('--pr-type <type>', 'PR template type (feature/bugfix/documentation/refactor/generic). Auto-detected if not specified.')
  .option('-l, --labels <labels>', 'Label list, comma separated')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .option('--draft', 'Create as draft PR')
  .option('--non-interactive', 'Skip interactive review and editing')
  .option('--issue <number>', 'Issue number for event reporting')
  .action(async (options) => {
    try {
      const { CreatePrCommand } = require('./commands');
      const command = new CreatePrCommand({ ...program.opts(), ...options });
      await command.execute(options);
    } catch (error) {
      console.error(chalk.red('✗ Creation failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Update Pull Request command
program
  .command('update-pr [prNumber]')
  .description('Update Pull Request info')
  .option('--id <prNumber>', 'PR number (alternative to positional argument)')
  .option('-t, --title <title>', 'New PR title')
  .option('-d, --description <description>', 'New PR description (use heredoc for multi-line: --description "$(cat <<\'EOF\'\nmulti-line\ndescription\nEOF\n)")')
  .option('-s, --state <state>', 'PR state (open/closed)')
  .option('-l, --labels <labels>', 'New label list, comma separated')
  .option('--target-branch <branch>', 'New target branch')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .action(async (prNumber, options) => {
    try {
      const { UpdatePrCommand } = require('./commands');
      const command = new UpdatePrCommand({ ...program.opts(), ...options });
      
      // 支持--id选项和位置参数
      const finalPrNumber = options.id || prNumber;
      if (!finalPrNumber) {
        console.error(chalk.red('✗ Error:'), 'PR number is required. Use --id <number> or provide as positional argument.');
        process.exit(1);
      }
      
      await command.execute(finalPrNumber, options);
    } catch (error) {
      console.error(chalk.red('✗ Update failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// List Issues command
program
  .command('list-issues')
  .description('List all Issues')
  .option('--state <state>', 'Filter by state (all/open/closed)', 'all')
  .option('--labels <labels>', 'Filter by labels, comma separated')
  .option('--assignee <assignee>', 'Filter by assignee')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .action(async (options) => {
    try {
      const { ListIssuesCommand } = require('./commands');
      const command = new ListIssuesCommand({ ...program.opts(), ...options });
      await command.execute(options);
    } catch (error) {
      console.error(chalk.red('✗ List failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// List Pull Requests command
program
  .command('list-prs')
  .description('List all Pull Requests')
  .option('--state <state>', 'Filter by state (all/open/closed)', 'open')
  .option('--head <head>', 'Filter by source branch')
  .option('--base <base>', 'Filter by target branch')
  .option('--sort <sort>', 'Sort field (created/updated/popularity)', 'created')
  .option('--direction <direction>', 'Sort direction (asc/desc)', 'desc')
  .option('--labels <labels>', 'Filter by labels, comma separated')
  .option('--assignee <assignee>', 'Filter by assignee')
  .option('--format <format>', 'Output format (text/json/table/concise)', 'concise')
  .action(async (options) => {
    try {
      const { ListPrsCommand } = require('./commands');
      const command = new ListPrsCommand({ ...program.opts(), ...options });
      await command.execute(options);
    } catch (error) {
      console.error(chalk.red('✗ List failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Add help information
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  $ gitcode-api create-issue --title "New Feature" --description "Description"');
  console.log('  $ gitcode-api update-issue 123 --state closed');
  console.log('  $ gitcode-api update-issue --id 123 --state closed');
  console.log('  $ gitcode-api get-issue --id 456 --format json');
  console.log('  $ gitcode-api create-pr --source-branch feat/new --target-branch main --title "New Feature PR"');
  console.log('  $ gitcode-api list-issues --state open --format json');
  console.log('');
  console.log(chalk.cyan('Configuration:'));
  console.log('  Config file location: ./code-platform-config.json');
  console.log('  Required fields: token, owner, repo');
  console.log('  Optional fields: mode, platformType, targetBranch');
});

module.exports = { program };
