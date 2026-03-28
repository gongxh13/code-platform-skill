/**
 * Issue相关API端点
 */

const logger = require('../../utils/logger');
const { formatError } = require('../../utils/formatters');
const { ConfigValidator } = require('../../config');

/**
 * Issue API端点
 */
class IssueAPI {
  /**
   * 创建Issue API端点
   * @param {GitCodeAPIClient} client - API客户端
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * 获取Issue列表
   * @param {Object} [params] - 查询参数
   * @param {string} [params.state] - 状态 (open/closed/all)
   * @param {string} [params.labels] - 标签（逗号分隔）
   * @param {string} [params.sort] - 排序 (created/updated/comments)
   * @param {string} [params.direction] - 排序方向 (asc/desc)
   * @param {number} [params.page] - 页码
   * @param {number} [params.per_page] - 每页数量
   * @returns {Promise<Array>} Issue列表
   */
  async list(params = {}) {
    try {
      const queryParams = {
        state: params.state || 'open',
        labels: params.labels,
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

      logger.debug(`获取Issue列表，参数: ${JSON.stringify(queryParams)}`);
      const issues = await this.client.get(`/repos/${this.client.config.owner}/${this.client.config.repo}/issues`, queryParams);
      logger.debug(`获取到 ${Array.isArray(issues) ? issues.length : 0} 个Issue`);
      return issues || [];
    } catch (error) {
      logger.error('获取Issue列表失败:', formatError(error));
      throw error;
    }
  }

  /**
   * 获取单个Issue
   * @param {number} issueNumber - Issue编号
   * @returns {Promise<Object>} Issue详情
   */
  async get(issueNumber) {
    try {
      if (!issueNumber || typeof issueNumber !== 'number') {
        throw new Error('Issue编号必须为数字');
      }

      logger.debug(`获取Issue #${issueNumber}`);
      const response = await this.client.get(`/repos/${this.client.config.owner}/${this.client.config.repo}/issues/${issueNumber}`);
      logger.debug(`API响应: ${JSON.stringify(response)}`);
      
      // 检查API错误响应
      if (response && response.error_code) {
        logger.error(`API错误响应: ${JSON.stringify(response)}`);
        throw new Error(`API错误: ${response.error_message || '未知错误'} (code: ${response.error_code})`);
      }
      
      // 处理不同的API响应格式
      let issue;
      if (response && typeof response === 'object') {
        // GitCode API返回的number可能是字符串，需要转换为数字
        const issueNumberResp = response.number || response.id || response.iid || response.issue_id;
        issue = {
          number: issueNumberResp ? parseInt(issueNumberResp, 10) : undefined,
          title: response.title || response.name || 'Untitled',
          ...response
        };
      } else {
        issue = response;
      }
      
      if (!issue.number || !issue.title) {
        logger.warn(`Issue响应缺少必要字段: number=${issue.number}, title=${issue.title}`);
      }
      
      return issue;
    } catch (error) {
      logger.error(`获取Issue #${issueNumber}失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 创建Issue
   * @param {Object} issueData - Issue数据
   * @param {string} [issueData.repo] - 仓库名（GitCode API必填，默认取配置repo）
   * @param {string} issueData.title - 标题
   * @param {string} issueData.body - 内容
   * @param {string} [issueData.labels] - 标签（逗号分隔）
   * @param {string} [issueData.assignee] - 指派人
   * @param {number} [issueData.milestone] - 里程碑ID
   * @param {string} [issueData.security_hole] - 安全漏洞标记
   * @param {string} [issueData.template_path] - 模板路径
   * @param {string} [issueData.issue_type] - Issue类型
   * @param {string} [issueData.issue_severity] - 严重程度
   * @param {Array<{field_name: string, field_values: string[]}>} [issueData.custom_fields] - 自定义字段
   * @returns {Promise<Object>} 创建的Issue
   */
  async create(issueData) {
    try {
      // 验证Issue数据
      const validatedData = ConfigValidator.validateIssueCreateConfig(issueData);

      const payload = { ...validatedData };

      if (!payload.repo) {
        payload.repo = this.client.config.repo;
      }

      if (Array.isArray(payload.assignees) && payload.assignees.length > 0 && !payload.assignee) {
        payload.assignee = payload.assignees[0];
      }
      delete payload.assignees;

      Object.keys(payload).forEach(key => {
        const value = payload[key];
        if (value === undefined || value === null || value === '') {
          delete payload[key];
          return;
        }
        if (Array.isArray(value) && value.length === 0) {
          delete payload[key];
        }
      });

      logger.debug(`创建Issue: ${payload.title}`);
      logger.debug(`发送的数据: ${JSON.stringify(payload)}`);
      logger.debug(`API端点: /repos/${this.client.config.owner}/${this.client.config.repo}/issues`);
      const response = await this.client.post(`/repos/${this.client.config.owner}/${this.client.config.repo}/issues`, payload);
      logger.debug(`API响应: ${JSON.stringify(response)}`);
      
      // 检查API错误响应
      if (response && response.error_code) {
        logger.error(`API错误响应: ${JSON.stringify(response)}`);
        throw new Error(`API错误: ${response.error_message || '未知错误'} (code: ${response.error_code})`);
      }
      
      // 处理不同的API响应格式
      let issue;
      if (response && typeof response === 'object') {
        // GitCode API返回的number可能是字符串，需要转换为数字
        const issueNumber = response.number || response.id || response.iid || response.issue_id;
        issue = {
          number: issueNumber ? parseInt(issueNumber, 10) : undefined,
          title: response.title || response.name || 'Untitled',
          ...response
        };
      } else {
        issue = response;
      }
      
      if (!issue.number || !issue.title) {
        logger.warn(`Issue响应缺少必要字段: number=${issue.number}, title=${issue.title}`);
      }
      
      logger.info(`Issue创建成功: #${issue.number} - ${issue.title}`);
      return issue;
    } catch (error) {
      logger.error('创建Issue失败:', formatError(error));
      throw error;
    }
  }

  /**
   * 更新Issue
   * @param {number} issueNumber - Issue编号
   * @param {Object} updateData - 更新数据
   * @param {string} [updateData.title] - 标题
   * @param {string} [updateData.body] - 内容
   * @param {string} [updateData.state] - 状态 (open/closed)
   * @param {Array<string>} [updateData.labels] - 标签
   * @param {Array<string>} [updateData.assignees] - 指派人
   * @param {string} [updateData.milestone] - 里程碑
   * @returns {Promise<Object>} 更新后的Issue
   */
  async update(issueNumber, updateData) {
    try {
      if (!issueNumber || typeof issueNumber !== 'number') {
        throw new Error('Issue编号必须为数字');
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

      // 归一化 labels 和 assignee 字段
      if (Array.isArray(atomGitData.labels)) {
        const normalizedLabels = atomGitData.labels.map(String).map(s => s.trim()).filter(Boolean);
        atomGitData.labels = normalizedLabels.join(',');
      }
      if (Array.isArray(atomGitData.assignees) && atomGitData.assignees.length > 0 && !atomGitData.assignee) {
        atomGitData.assignee = atomGitData.assignees[0];
      }
      delete atomGitData.assignees;

      // 移除空值字段
      Object.keys(atomGitData).forEach(key => {
        const value = atomGitData[key];
        if (value === undefined || value === null || value === '') {
          delete atomGitData[key];
          return;
        }
        if (Array.isArray(value) && value.length === 0) {
          delete atomGitData[key];
        }
      });

      // AtomGit API要求至少提供一个字段（除了state）
      // 如果只有state字段，需要获取当前issue的标题来满足API要求
      const hasOtherFields = Object.keys(atomGitData).some(key => key !== 'state');
      if (!hasOtherFields && atomGitData.state) {
        try {
          // 获取当前issue以获取标题
          const currentIssue = await this.get(issueNumber);
          atomGitData.title = currentIssue.title; // 使用当前标题
          logger.debug(`添加标题字段以满足AtomGit API要求: "${currentIssue.title}"`);
        } catch (error) {
          // 如果获取issue失败（例如issue不存在），仍然尝试更新
          // 但需要添加一个虚拟标题以满足API要求
          atomGitData.title = `Issue #${issueNumber}`;
          logger.warn(`无法获取Issue #${issueNumber}的标题，使用虚拟标题: "${atomGitData.title}"`);
        }
      }

      logger.debug(`更新Issue #${issueNumber}`, { originalData: updateData, atomGitData });
      const response = await this.client.patch(`/repos/${this.client.config.owner}/${this.client.config.repo}/issues/${issueNumber}`, atomGitData);
      logger.debug(`API响应: ${JSON.stringify(response)}`);
      
      // 检查API错误响应
      if (response && response.error_code) {
        logger.error(`API错误响应: ${JSON.stringify(response)}`);
        throw new Error(`API错误: ${response.error_message || '未知错误'} (code: ${response.error_code})`);
      }
      
      // 处理不同的API响应格式
      let issue;
      if (response && typeof response === 'object') {
        // GitCode API返回的number可能是字符串，需要转换为数字
        const issueNumberResp = response.number || response.id || response.iid || response.issue_id;
        issue = {
          number: issueNumberResp ? parseInt(issueNumberResp, 10) : undefined,
          title: response.title || response.name || 'Untitled',
          ...response
        };
      } else {
        issue = response;
      }
      
      if (!issue.number || !issue.title) {
        logger.warn(`Issue响应缺少必要字段: number=${issue.number}, title=${issue.title}`);
      }
      
      logger.info(`Issue更新成功: #${issue.number}`);
      return issue;
    } catch (error) {
      logger.error(`更新Issue #${issueNumber}失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 关闭Issue
   * @param {number} issueNumber - Issue编号
   * @returns {Promise<Object>} 关闭后的Issue
   */
  async close(issueNumber) {
    return this.update(issueNumber, { state: 'closed' });
  }

  /**
   * 重新打开Issue
   * @param {number} issueNumber - Issue编号
   * @returns {Promise<Object>} 重新打开后的Issue
   */
  async reopen(issueNumber) {
    return this.update(issueNumber, { state: 'open' });
  }

  /**
   * 搜索Issue
   * @param {string} query - 搜索查询
   * @param {Object} [params] - 搜索参数
   * @returns {Promise<Array>} 搜索结果
   */
  async search(query, params = {}) {
    try {
      if (!query || typeof query !== 'string') {
        throw new Error('搜索查询不能为空');
      }

      const searchParams = {
        q: `${query} repo:${this.client.config.owner}/${this.client.config.repo}`,
        ...params
      };

      logger.debug(`搜索Issue: ${query}`);
      const result = await this.client.get('/search/issues', searchParams);
      return result.items || [];
    } catch (error) {
      logger.error(`搜索Issue失败 "${query}":`, formatError(error));
      throw error;
    }
  }

  /**
   * 获取Issue评论
   * @param {number} issueNumber - Issue编号
   * @param {Object} [params] - 查询参数
   * @returns {Promise<Array>} 评论列表
   */
  async getComments(issueNumber, params = {}) {
    try {
      if (!issueNumber || typeof issueNumber !== 'number') {
        throw new Error('Issue编号必须为数字');
      }

      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || 30
      };

      logger.debug(`获取Issue #${issueNumber}的评论`);
      const comments = await this.client.get(`/repos/${this.client.config.owner}/${this.client.config.repo}/issues/${issueNumber}/comments`, queryParams);
      return comments || [];
    } catch (error) {
      logger.error(`获取Issue #${issueNumber}评论失败:`, formatError(error));
      throw error;
    }
  }

  /**
   * 添加Issue评论
   * @param {number} issueNumber - Issue编号
   * @param {string} body - 评论内容
   * @returns {Promise<Object>} 创建的评论
   */
  async addComment(issueNumber, body) {
    try {
      if (!issueNumber || typeof issueNumber !== 'number') {
        throw new Error('Issue编号必须为数字');
      }

      if (!body || typeof body !== 'string') {
        throw new Error('评论内容不能为空');
      }

      logger.debug(`为Issue #${issueNumber}添加评论`);
      const comment = await this.client.post(`/repos/${this.client.config.owner}/${this.client.config.repo}/issues/${issueNumber}/comments`, { body });
      logger.info(`评论添加成功`);
      return comment;
    } catch (error) {
      logger.error(`为Issue #${issueNumber}添加评论失败:`, formatError(error));
      throw error;
    }
  }
}

module.exports = IssueAPI;
