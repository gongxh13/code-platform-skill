/**
 * Pull Request相关API端点
 */

const logger = require('../../utils/logger');
const { formatError } = require('../../utils/formatters');
const { ConfigValidator } = require('../../config');

/**
 * Pull Request API端点
 */
class PullRequestAPI {
  /**
   * 创建PR API端点
   * @param {GitCodeAPIClient} client - API客户端
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * 获取PR列表
   * @param {Object} [params] - 查询参数
   * @param {string} [params.state] - 状态 (open/closed/all)
   * @param {string} [params.head] - 源分支
   * @param {string} [params.base] - 目标分支
   * @param {string} [params.sort] - 排序 (created/updated/popularity)
   * @param {string} [params.direction] - 排序方向 (asc/desc)
   * @param {number} [params.page] - 页码
   * @param {number} [params.per_page] - 每页数量
   * @returns {Promise<Array>} PR列表
   */
  async list(params = {}) {
    try {
      const queryParams = {
        state: params.state || 'open',
        head: params.head,
        base: params.base,
        sort: params.sort || 'created',
        direction: params.direction || 'desc',
        page: params.page || 1,
        per_page: params.per_page || 30
      };

      // 移除undefined参数
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      logger.debug(`获取PR列表，参数: ${JSON.stringify(queryParams)}`);
      const pullRequests = await this.client.get(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls`, queryParams);
      logger.debug(`获取到 ${Array.isArray(pullRequests) ? pullRequests.length : 0} 个PR`);
      return pullRequests || [];
    } catch (error) {
      logger.error('获取PR列表失败:', formatError(error));
      throw error;
    }
  }

  /**
   * 获取单个PR
   * @param {number} prNumber - PR编号
   * @returns {Promise<Object>} PR详情
   */
  async get(prNumber) {
    try {
      if (!prNumber || typeof prNumber !== 'number') {
        throw new Error('PR编号必须为数字');
      }

      logger.debug(`获取PR #${prNumber}`);
      const pr = await this.client.get(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls/${prNumber}`);
      return pr;
    } catch (error) {
      logger.error(`获取PR #${prNumber}失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 创建PR
   * @param {Object} prData - PR数据
   * @param {string} prData.title - 标题
   * @param {string} prData.body - 内容
   * @param {string} prData.head - 源分支
   * @param {string} prData.base - 目标分支
   * @param {boolean} [prData.draft] - 是否为草稿
   * @param {Array<string>} [prData.labels] - 标签
   * @param {Array<string>} [prData.assignees] - 指派人
   * @param {string} [prData.milestone] - 里程碑
   * @returns {Promise<Object>} 创建的PR
   */
  async create(prData) {
    try {
      // 验证PR数据
      const validatedData = ConfigValidator.validatePrCreateConfig(prData);

      // 清理空数组和空字符串 - AtomGit API不接受空数组
      // 验证器可能添加了默认的空数组或空字符串，需要移除
      if (validatedData.labels && Array.isArray(validatedData.labels) && validatedData.labels.length === 0) {
        delete validatedData.labels;
      }
      if (validatedData.assignees && validatedData.assignees === '') {
        delete validatedData.assignees;
      }

      // 处理跨仓库PR：如果配置中有forkOwner且head不包含冒号，自动添加前缀
      const forkOwner = this.client.config.forkOwner;
      if (forkOwner && validatedData.head && !validatedData.head.includes(':')) {
        const originalHead = validatedData.head;
        validatedData.head = `${forkOwner}:${originalHead}`;
        logger.debug(`跨仓库PR检测，自动转换head参数: "${originalHead}" → "${validatedData.head}"`);
      }

      logger.debug(`创建PR: ${validatedData.title}`);
      logger.debug(`发送的数据: ${JSON.stringify(validatedData)}`);
      const pr = await this.client.post(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls`, validatedData);
      logger.info(`PR创建成功: #${pr.number} - ${pr.title}`);
      return pr;
    } catch (error) {
      logger.error('创建PR失败:', formatError(error));
      throw error;
    }
  }

  /**
   * Link Issue to PR
   * Note: The API endpoint returns 400 "Request body parsing error" - may need investigation
   */
  async linkIssue(prNumber, issueNumber) {
    try {
      const url = `/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls/${prNumber}/issues`;
      const data = JSON.stringify([issueNumber]);
      const result = await this.client.post(url, data);
      logger.info(`Issue #${issueNumber} linked to PR #${prNumber}`);
      return result;
    } catch (error) {
      logger.warn(`Failed to link issue #${issueNumber} to PR #${prNumber}:`, error.message);
      return null;
    }
  }

  /**
   * 更新PR
   * @param {number} prNumber - PR编号
   * @param {Object} updateData - 更新数据
   * @param {string} [updateData.title] - 标题
   * @param {string} [updateData.body] - 内容
   * @param {string} [updateData.state] - 状态 (open/closed)
   * @param {string} [updateData.base] - 目标分支
   * @param {Array<string>} [updateData.labels] - 标签
   * @param {Array<string>} [updateData.assignees] - 指派人
   * @param {string} [updateData.milestone] - 里程碑
   * @returns {Promise<Object>} 更新后的PR
   */
  async update(prNumber, updateData) {
    try {
      if (!prNumber || typeof prNumber !== 'number') {
        throw new Error('PR编号必须为数字');
      }

      // 处理AtomGit API的特殊字段映射
      // AtomGit使用state字段，但值必须是'close'或'reopen'，而不是'closed'或'open'
      const atomGitData = { ...updateData };
      if (atomGitData.state) {
        // 将state值映射为AtomGit API期望的值
        if (atomGitData.state === 'closed') {
          atomGitData.state = 'close';
        } else if (atomGitData.state === 'open') {
          atomGitData.state = 'reopen';
        }
      }

      // AtomGit API要求至少提供一个字段（除了state）
      // 如果只有state字段，需要获取当前PR的标题来满足API要求
      const hasOtherFields = Object.keys(atomGitData).some(key => key !== 'state');
      if (!hasOtherFields && atomGitData.state) {
        // 获取当前PR以获取标题
        const currentPr = await this.get(prNumber);
        atomGitData.title = currentPr.title; // 使用当前标题
        logger.debug(`添加标题字段以满足AtomGit API要求: "${currentPr.title}"`);
      }

      logger.debug(`更新PR #${prNumber}`, { originalData: updateData, atomGitData });
      const pr = await this.client.patch(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repository || this.client.config.repository || this.client.config.repo}/pulls/${prNumber}`, atomGitData);
      logger.info(`PR更新成功: #${pr.number}`);
      return pr;
    } catch (error) {
      logger.error(`更新PR #${prNumber}失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 合并PR
   * @param {number} prNumber - PR编号
   * @param {Object} [mergeData] - 合并参数
   * @param {string} [mergeData.commit_title] - 合并提交标题
   * @param {string} [mergeData.commit_message] - 合并提交信息
   * @param {string} [mergeData.merge_method] - 合并方法 (merge/squash/rebase)
   * @returns {Promise<Object>} 合并结果
   */
  async merge(prNumber, mergeData = {}) {
    try {
      if (!prNumber || typeof prNumber !== 'number') {
        throw new Error('PR编号必须为数字');
      }

      const mergeParams = {
        commit_title: mergeData.commit_title || `Merge pull request #${prNumber}`,
        commit_message: mergeData.commit_message || '',
        merge_method: mergeData.merge_method || 'merge',
        ...mergeData
      };

      logger.debug(`合并PR #${prNumber}`);
      const result = await this.client.put(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls/${prNumber}/merge`, mergeParams);
      logger.info(`PR #${prNumber} 合并成功`);
      return result;
    } catch (error) {
      logger.error(`合并PR #${prNumber}失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 关闭PR
   * @param {number} prNumber - PR编号
   * @returns {Promise<Object>} 关闭后的PR
   */
  async close(prNumber) {
    return this.update(prNumber, { state: 'closed' });
  }

  /**
   * 重新打开PR
   * @param {number} prNumber - PR编号
   * @returns {Promise<Object>} 重新打开后的PR
   */
  async reopen(prNumber) {
    return this.update(prNumber, { state: 'open' });
  }

  /**
   * 获取PR文件列表
   * @param {number} prNumber - PR编号
   * @param {Object} [params] - 查询参数
   * @returns {Promise<Array>} 文件列表
   */
  async getFiles(prNumber, params = {}) {
    try {
      if (!prNumber || typeof prNumber !== 'number') {
        throw new Error('PR编号必须为数字');
      }

      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || 100
      };

      logger.debug(`获取PR #${prNumber}的文件列表`);
      const files = await this.client.get(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls/${prNumber}/files`, queryParams);
      return files || [];
    } catch (error) {
      logger.error(`获取PR #${prNumber}文件列表失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 获取PR评论
   * @param {number} prNumber - PR编号
   * @param {Object} [params] - 查询参数
   * @returns {Promise<Array>} 评论列表
   */
  async getComments(prNumber, params = {}) {
    try {
      if (!prNumber || typeof prNumber !== 'number') {
        throw new Error('PR编号必须为数字');
      }

      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || 30
      };

      logger.debug(`获取PR #${prNumber}的评论`);
      const comments = await this.client.get(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls/${prNumber}/comments`, queryParams);
      return comments || [];
    } catch (error) {
      logger.error(`获取PR #${prNumber}评论失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 添加PR评论
   * @param {number} prNumber - PR编号
   * @param {string} body - 评论内容
   * @returns {Promise<Object>} 创建的评论
   */
  async addComment(prNumber, body) {
    try {
      if (!prNumber || typeof prNumber !== 'number') {
        throw new Error('PR编号必须为数字');
      }

      if (!body || typeof body !== 'string') {
        throw new Error('评论内容不能为空');
      }

      logger.debug(`为PR #${prNumber}添加评论`);
      const comment = await this.client.post(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls/${prNumber}/comments`, { body });
      logger.info(`评论添加成功`);
      return comment;
    } catch (error) {
      logger.error(`为PR #${prNumber}添加评论失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 获取PR审查状态
   * @param {number} prNumber - PR编号
   * @returns {Promise<Object>} 审查状态
   */
  async getReviewStatus(prNumber) {
    try {
      if (!prNumber || typeof prNumber !== 'number') {
        throw new Error('PR编号必须为数字');
      }

      logger.debug(`获取PR #${prNumber}的审查状态`);
      const reviews = await this.client.get(`/repos/${this.client.config.owner}/${this.client.config.repository || this.client.config.repo}/pulls/${prNumber}/reviews`);
      return {
        total: reviews.length,
        approved: reviews.filter(r => r.state === 'APPROVED').length,
        changes_requested: reviews.filter(r => r.state === 'CHANGES_REQUESTED').length,
        commented: reviews.filter(r => r.state === 'COMMENTED').length,
        reviews: reviews
      };
    } catch (error) {
      logger.error(`获取PR #${prNumber}审查状态失败:`, formatError(error));
      throw error;
    }
  }
}

module.exports = PullRequestAPI;