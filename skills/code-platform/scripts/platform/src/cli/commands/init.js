/**
 * Init Config Command - Initialize platform configuration
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class InitConfigCommand {
  constructor(options = {}) {
    this.options = options;
  }

  async execute() {
    const { token, platform, owner, repo, output } = this.options;

    if (!token || !owner || !repo) {
      console.error(chalk.red('✗ Error: Missing required parameters (--token, --owner, --repo)'));
      console.log('\nUsage:');
      console.log('  platform-api init --token <token> --owner <owner> --repo <repo> [--platform gitcode|github] [--output <path>]');
      process.exit(1);
    }

    try {
      console.log(chalk.blue('ℹ'), `Initializing configuration for ${owner}/${repo} on ${platform}...`);

      const repoInfo = await this.getRepoInfo(platform, token, owner, repo);
      const branches = await this.listBranches(platform, token, repoInfo.upstream_owner || owner, repoInfo.upstream_repo || repo);

      const configPath = this.writeConfigFile(repoInfo, branches, output);

      console.log(chalk.green('✓'), `Configuration written to: ${configPath}`);
      console.log('\nConfiguration:');
      console.log(JSON.stringify({
        token: '***',
        owner: owner,
        repository: repo,
        platformType: platform,
        isFork: repoInfo.is_fork
      }, null, 2));

      process.exit(0);
    } catch (error) {
      console.error(chalk.red('✗ Error:'), error.message);
      if (this.options.verbose || this.options.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  getApiConfig(platform, token) {
    if (platform === 'github') {
      return {
        baseUrl: 'https://api.github.com',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      };
    }
    return {
      baseUrl: 'https://api.gitcode.com/api/v5',
      headers: {
        'PRIVATE-TOKEN': token,
        'Accept': 'application/json'
      }
    };
  }

  httpRequest(url, headers) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const transport = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'ADT-Upstream-Resolver',
          'Accept': 'application/json',
          ...headers
        },
        rejectUnauthorized: false
      };

      const req = transport.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body, headers: res.headers });
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(15000, () => {
        req.destroy(new Error('Request timeout'));
      });
      req.end();
    });
  }

  async getRepoInfo(platform, token, owner, repo) {
    const config = this.getApiConfig(platform, token);
    const url = `${config.baseUrl}/repos/${owner}/${repo}`;

    const res = await this.httpRequest(url, config.headers);

    if (res.status === 401) {
      throw new Error('Token 无效（401），请检查 Token 是否正确');
    }
    if (res.status === 403) {
      throw new Error('Token 权限不足（403）');
    }
    if (res.status === 404) {
      const bodyLower = (res.body || '').toLowerCase();
      if (bodyLower.includes('token')) {
        throw new Error('Token 无效（404, token not found），请确保使用正确平台的 Token');
      }
      throw new Error(`仓库不存在或无权访问: ${owner}/${repo}`);
    }
    if (res.status !== 200) {
      throw new Error(`API 错误（${res.status}）: ${(res.body || '').substring(0, 200)}`);
    }

    const data = JSON.parse(res.body);

    if (platform === 'github') {
      return this.parseGitHubRepoInfo(data, owner, repo);
    }
    return this.parseGitCodeRepoInfo(data, owner, repo);
  }

  parseGitHubRepoInfo(data, owner, repo) {
    const isFork = data.fork === true;
    const parentData = data.parent;

    const result = {
      is_fork: isFork,
      fork_owner: owner,
      fork_repo: repo,
      upstream_owner: owner,
      upstream_repo: repo,
      default_branch: data.default_branch || 'main',
      upstream_default_branch: data.default_branch || 'main'
    };

    if (isFork && parentData) {
      const fullName = parentData.full_name || '';
      const parts = fullName.split('/');
      if (parts.length === 2) {
        result.upstream_owner = parts[0];
        result.upstream_repo = parts[1];
      }
      result.upstream_default_branch = parentData.default_branch || 'main';
    }

    return result;
  }

  parseGitCodeRepoInfo(data, owner, repo) {
    const forkedFrom = data.forked_from_project || data.parent;
    const isFork = forkedFrom != null;

    const result = {
      is_fork: isFork,
      fork_owner: owner,
      fork_repo: repo,
      upstream_owner: owner,
      upstream_repo: repo,
      default_branch: data.default_branch || 'main',
      upstream_default_branch: data.default_branch || 'main'
    };

    if (isFork && typeof forkedFrom === 'object') {
      const parentFull = forkedFrom.path_with_namespace || forkedFrom.full_name || '';
      const parts = parentFull.split('/');
      if (parts.length === 2) {
        result.upstream_owner = parts[0];
        result.upstream_repo = parts[1];
      }
      result.upstream_default_branch = forkedFrom.default_branch || 'main';
    }

    return result;
  }

  async listBranches(platform, token, owner, repo) {
    const config = this.getApiConfig(platform, token);
    const branches = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = `${config.baseUrl}/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`;
      const res = await this.httpRequest(url, config.headers);

      if (res.status !== 200) {
        if (branches.length === 0) {
          throw new Error(`获取分支列表失败（${res.status}）: ${(res.body || '').substring(0, 200)}`);
        }
        break;
      }

      const data = JSON.parse(res.body);
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      for (const branch of data) {
        branches.push(branch.name);
      }

      if (data.length < perPage) {
        break;
      }
      page++;
    }

    return branches;
  }

  writeConfigFile(repoInfo, branches, outputPath) {
    const config = {
      token: this.options.token,
      owner: repoInfo.is_fork ? repoInfo.fork_owner : this.options.owner,
      repository: repoInfo.is_fork ? repoInfo.fork_repo : this.options.repo,
      platformType: this.options.platform || 'gitcode',
      isFork: repoInfo.is_fork,
      defaultBranch: repoInfo.default_branch,
      upstreamDefaultBranch: repoInfo.upstream_default_branch
    };

    if (repoInfo.is_fork) {
      config.upstream = {
        owner: repoInfo.upstream_owner,
        repo: repoInfo.upstream_repo
      };
    }

    const finalPath = outputPath || path.join(process.cwd(), 'code-platform-config.json');
    fs.writeFileSync(finalPath, JSON.stringify(config, null, 2));

    return finalPath;
  }
}

module.exports = InitConfigCommand;
