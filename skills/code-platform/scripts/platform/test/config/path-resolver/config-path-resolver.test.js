/**
 * ConfigPathResolver 测试
 */

const path = require('path');
const fs = require('fs').promises;
const { describe, it, beforeEach, afterEach } = require('@jest/globals');
const ConfigPathResolver = require('../../../src/config/path-resolver/config-path-resolver');
const UpwardSearchStrategy = require('../../../src/config/path-resolver/strategies/upward-search-strategy');
const EnvVarStrategy = require('../../../src/config/path-resolver/strategies/env-var-strategy');
const HomeDirectoryStrategy = require('../../../src/config/path-resolver/strategies/home-directory-strategy');
const { ConfigNotFoundError } = require('../../../src/config/path-resolver/config-path-error');

// 模拟日志记录器
const mockLogger = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// 测试临时目录
const TEST_TEMP_DIR = path.join(__dirname, 'temp-test-dir');

describe('ConfigPathResolver', () => {
  let resolver;
  
  beforeEach(() => {
    // 创建测试目录
    fs.mkdir(TEST_TEMP_DIR, { recursive: true }).catch(() => {});
    
    // 创建解析器实例
    resolver = new ConfigPathResolver({
      logger: mockLogger,
      enableParallelSearch: false // 测试时禁用并行搜索以确保确定性
    });
    
    // 重置模拟函数
    jest.clearAllMocks();
  });
  
  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(TEST_TEMP_DIR, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });
  
  describe('构造函数', () => {
    it('应该使用默认策略创建实例', () => {
      expect(resolver).toBeDefined();
      expect(resolver.strategies).toBeInstanceOf(Array);
      expect(resolver.strategies.length).toBeGreaterThan(0);
      expect(resolver.cache).toBeDefined();
    });
    
    it('应该按优先级排序策略', () => {
      const priorities = resolver.strategies.map(s => s.priority);
      const sortedPriorities = [...priorities].sort((a, b) => a - b);
      expect(priorities).toEqual(sortedPriorities);
    });
    
    it('应该接受自定义策略', () => {
      const customStrategy = new UpwardSearchStrategy({ priority: 1 });
      const customResolver = new ConfigPathResolver({
        strategies: [customStrategy],
        logger: mockLogger
      });
      
      expect(customResolver.strategies).toHaveLength(1);
      expect(customResolver.strategies[0]).toBe(customStrategy);
    });
  });
  
  describe('resolve 方法', () => {
    it('应该抛出 ConfigNotFoundError 当配置文件不存在时', async () => {
      await expect(resolver.resolve('non-existent-config.json', TEST_TEMP_DIR))
        .rejects
        .toThrow(ConfigNotFoundError);
    });
    
    it('应该正确处理 ConfigNotFoundError', async () => {
      await expect(resolver.resolve('non-existent-config.json', TEST_TEMP_DIR))
        .rejects
        .toThrow(ConfigNotFoundError);
    });
    
    it('应该使用缓存提高性能', async () => {
      // 创建测试配置文件
      const testConfigPath = path.join(TEST_TEMP_DIR, 'test-config.json');
      await fs.writeFile(testConfigPath, JSON.stringify({ test: true }));
      
      // 第一次调用应该缓存找到的结果
      const result1 = await resolver.resolve('test-config.json', TEST_TEMP_DIR);
      expect(result1.path).toBe(testConfigPath);
      expect(result1.metadata).toBeDefined();
      
      // 检查缓存统计
      const stats = resolver.getCacheStats();
      expect(stats.misses).toBe(1);
      
      // 第二次调用应该使用缓存
      const result2 = await resolver.resolve('test-config.json', TEST_TEMP_DIR);
      expect(result2.path).toBe(testConfigPath);
      expect(result2.metadata).toBeDefined();
      
      const stats2 = resolver.getCacheStats();
      expect(stats2.hits).toBe(1);
      
      // 清理测试文件
      await fs.unlink(testConfigPath);
    });
  });
  
  describe('缓存管理', () => {
    it('应该清空缓存', () => {
      const initialStats = resolver.getCacheStats();
      resolver.clearCache();
      const finalStats = resolver.getCacheStats();
      
      expect(finalStats.size).toBe(0);
      expect(finalStats.hits).toBe(0);
      expect(finalStats.misses).toBe(0);
    });
    
    it('应该返回缓存统计信息', () => {
      const stats = resolver.getCacheStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('size');
    });
  });
  
  describe('策略管理', () => {
    it('应该添加新策略', () => {
      const initialCount = resolver.strategies.length;
      const newStrategy = new UpwardSearchStrategy({ priority: 5 });
      
      resolver.addStrategy(newStrategy);
      
      expect(resolver.strategies).toHaveLength(initialCount + 1);
      expect(resolver.strategies).toContain(newStrategy);
    });
    
    it('应该移除策略', () => {
      const strategyToRemove = resolver.strategies[0];
      const removed = resolver.removeStrategy(strategyToRemove.name);
      
      expect(removed).toBe(true);
      expect(resolver.strategies).not.toContain(strategyToRemove);
    });
    
    it('应该返回策略信息', () => {
      const strategyInfo = resolver.getStrategyInfo();
      
      expect(strategyInfo).toBeInstanceOf(Array);
      expect(strategyInfo.length).toBe(resolver.strategies.length);
      
      strategyInfo.forEach(info => {
        expect(info).toHaveProperty('name');
        expect(info).toHaveProperty('priority');
        expect(info).toHaveProperty('isIndependent');
        expect(info).toHaveProperty('description');
      });
    });
  });
  
  describe('并行搜索', () => {
    it('应该启用和禁用并行搜索', () => {
      resolver.setParallelSearch(true);
      expect(resolver.enableParallelSearch).toBe(true);
      
      resolver.setParallelSearch(false);
      expect(resolver.enableParallelSearch).toBe(false);
    });
  });
});

describe('搜索策略', () => {
  describe('UpwardSearchStrategy', () => {
    it('应该正确创建实例', () => {
      const strategy = new UpwardSearchStrategy({
        maxDepth: 10,
        includeStartDir: false
      });
      
      expect(strategy.name).toBe('UpwardSearchStrategy');
      expect(strategy.maxDepth).toBe(10);
      expect(strategy.includeStartDir).toBe(false);
    });
    
    it('应该包含起始目录当配置为 true 时', () => {
      const strategy = new UpwardSearchStrategy({ includeStartDir: true });
      expect(strategy.includeStartDir).toBe(true);
    });
  });
  
  describe('EnvVarStrategy', () => {
    it('应该从环境变量读取路径', () => {
      const mockEnv = { AGENTDEV_CONFIG_PATH: '/custom/path/config.json' };
      const strategy = new EnvVarStrategy({ env: mockEnv });
      
      expect(strategy.envVar).toBe('AGENTDEV_CONFIG_PATH');
    });
    
    it('应该使用最高优先级', () => {
      const strategy = new EnvVarStrategy();
      expect(strategy.priority).toBe(10);
    });
  });
  
  describe('HomeDirectoryStrategy', () => {
    it('应该使用正确的主目录路径', () => {
      const mockHomeDir = '/mock/home';
      const strategy = new HomeDirectoryStrategy({ baseDir: mockHomeDir });
      
      expect(strategy.baseDir).toBe(mockHomeDir);
      expect(strategy.subPath).toBe('.agentdev');
    });
  });
});