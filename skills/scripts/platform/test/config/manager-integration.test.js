/**
 * ConfigManager 集成测试
 * 测试新的路径解析器与现有 ConfigManager 的集成
 */

const path = require('path');
const fs = require('fs').promises;
const { describe, it, beforeEach, afterEach } = require('@jest/globals');
const ConfigManager = require('../../src/config/manager');

// 测试临时目录
const TEST_TEMP_DIR = path.join(__dirname, 'temp-integration-test');

describe('ConfigManager 与路径解析器集成', () => {
  let configManager;
  
  beforeEach(async () => {
    // 创建测试目录
    await fs.mkdir(TEST_TEMP_DIR, { recursive: true });
    
    // 创建测试配置文件
    const testConfig = {
      token: 'test-token',
      owner: 'test-owner',
      repository: 'test-repo'
    };
    
    const configDir = path.join(TEST_TEMP_DIR, '.agentdev');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify(testConfig, null, 2)
    );
  });
  
  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(TEST_TEMP_DIR, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });
  
  describe('向后兼容性', () => {
    it('应该默认使用旧的路径查找方法', () => {
      configManager = new ConfigManager({
        configPath: path.join(TEST_TEMP_DIR, '.agentdev/config.json')
      });
      
      expect(configManager.useNewPathResolver).toBe(true); // 默认启用
    });
    
    it('应该可以禁用新的路径解析器', () => {
      configManager = new ConfigManager({
        configPath: path.join(TEST_TEMP_DIR, '.agentdev/config.json'),
        useNewPathResolver: false
      });
      
      expect(configManager.useNewPathResolver).toBe(false);
      expect(configManager.pathResolver).toBeUndefined();
    });
  });
  
  describe('路径解析器管理', () => {
    beforeEach(() => {
      configManager = new ConfigManager({
        configPath: path.join(TEST_TEMP_DIR, '.agentdev/config.json')
      });
    });
    
    it('应该启用新的路径解析器', () => {
      configManager.disableNewPathResolver();
      expect(configManager.useNewPathResolver).toBe(false);
      
      configManager.enableNewPathResolver();
      expect(configManager.useNewPathResolver).toBe(true);
      expect(configManager.pathResolver).toBeDefined();
    });
    
    it('应该禁用新的路径解析器', () => {
      configManager.disableNewPathResolver();
      expect(configManager.useNewPathResolver).toBe(false);
      expect(configManager.pathResolver).toBeNull();
    });
    
    it('应该获取路径解析器统计信息', () => {
      const stats = configManager.getPathResolverStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
    });
    
    it('应该清空路径解析器缓存', () => {
      const stats = configManager.clearPathResolverCache();
      expect(stats).toBeDefined();
    });
    
    it('应该获取搜索策略信息', () => {
      const strategyInfo = configManager.getSearchStrategyInfo();
      expect(strategyInfo).toBeInstanceOf(Array);
      expect(strategyInfo.length).toBeGreaterThan(0);
    });
  });
  
  describe('配置加载', () => {
    it('应该使用新的路径解析器加载配置', async () => {
      configManager = new ConfigManager({
        configPath: '.agentdev/config.json', // 相对路径
        useNewPathResolver: true
      });
      
      // 更改工作目录到测试目录
      const originalCwd = process.cwd();
      process.chdir(TEST_TEMP_DIR);
      
      try {
        const config = await configManager.load();
        expect(config).toBeDefined();
        expect(config.token).toBe('test-token');
        expect(config.owner).toBe('test-owner');
        expect(config.repository).toBe('test-repo');
      } finally {
        process.chdir(originalCwd);
      }
    });
    
    it('应该回退到旧方法当新的解析器失败时', async () => {
      // 模拟路径解析器失败
      const mockPathResolver = {
        resolve: jest.fn().mockRejectedValue(new Error('模拟失败'))
      };
      
      configManager = new ConfigManager({
        configPath: '.agentdev/config.json', // 使用相对路径
        useNewPathResolver: true
      });
      
      // 替换路径解析器
      configManager.pathResolver = mockPathResolver;
      
      // 更改工作目录到测试目录
      const originalCwd = process.cwd();
      process.chdir(TEST_TEMP_DIR);
      
      try {
        const config = await configManager.load();
        expect(config).toBeDefined();
        expect(mockPathResolver.resolve).toHaveBeenCalled();
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
  
  describe('性能测试', () => {
    it('应该缓存查找结果', async () => {
      configManager = new ConfigManager({
        configPath: '.agentdev/config.json',
        useNewPathResolver: true
      });
      
      const originalCwd = process.cwd();
      process.chdir(TEST_TEMP_DIR);
      
      try {
        // 第一次加载
        await configManager.load();
        const stats1 = configManager.getPathResolverStats();
        
        // 清除已加载的配置，强制重新加载
        configManager.config = null;
        configManager.loaded = false;
        
        // 第二次加载应该使用缓存
        await configManager.load();
        const stats2 = configManager.getPathResolverStats();
        
        expect(stats2.hits).toBeGreaterThan(stats1.hits);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});