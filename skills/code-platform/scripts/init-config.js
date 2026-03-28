#!/usr/bin/env node

/**
 * Code Platform Configuration Initialization Script
 * Creates ./code-platform-config.json with platform credentials and repository information
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    token: null,
    owner: null,
    repo: null,
    platform: 'gitcode'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--token' && i + 1 < args.length) {
      params.token = args[++i];
    } else if (arg === '--owner' && i + 1 < args.length) {
      params.owner = args[++i];
    } else if (arg === '--repo' && i + 1 < args.length) {
      params.repo = args[++i];
    } else if (arg === '--platform' && i + 1 < args.length) {
      params.platform = args[++i];
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  if (!params.token || !params.owner || !params.repo) {
    console.error('Error: Missing required parameters');
    printHelp();
    process.exit(1);
  }

  params.apiBaseUrl = getDefaultApiBaseUrl(params.platform);

  return params;
}

function getDefaultApiBaseUrl(platform) {
  const urls = {
    gitcode: 'https://api.atomgit.com/api/v5',
    github: 'https://api.github.com',
    gitlab: 'https://gitlab.com/api/v4'
  };
  return urls[platform] || 'https://api.atomgit.com/api/v5';
}

function printHelp() {
  console.log(`
Code Platform Configuration Initialization Script

Usage:
  node init-config.js [options]

Required Options:
  --token TOKEN      Personal access token
  --owner OWNER      Repository owner (user or organization)
  --repo REPO        Repository name

Optional Options:
  --platform PLATFORM    Platform type: gitcode, github, gitlab (default: gitcode)
  --help                 Show this help message

Example:
  node init-config.js \
    --token gcode_123456 \
    --owner myorg \
    --repo myrepo \
    --platform gitcode
`);
}

function createConfig(params) {
  return {
    token: params.token,
    owner: params.owner,
    repo: params.repo,
    platformType: params.platform,
    apiBaseUrl: params.apiBaseUrl
  };
}

function main() {
  try {
    const params = parseArgs();

    const configFile = path.join(process.cwd(), 'code-platform-config.json');

    if (fs.existsSync(configFile)) {
      console.log(`Warning: Configuration file already exists: ${configFile}`);
      console.log('Use --force to overwrite');
      process.exit(1);
    }

    const config = createConfig(params);
    const configJson = JSON.stringify(config, null, 2);

    fs.writeFileSync(configFile, configJson, 'utf8');
    console.log(`Configuration file created: ${configFile}`);

    console.log('\nSecurity Reminder:');
    console.log('- The token is stored in plain text in code-platform-config.json');
    console.log('- Add code-platform-config.json to .gitignore to prevent accidental commits');
    console.log('- Never commit this file to version control');

    if (fs.existsSync(configFile)) {
      console.log('\nConfiguration completed successfully!');
    } else {
      console.error('\nError: Configuration file was not created');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\nError during initialization: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createConfig, parseArgs };