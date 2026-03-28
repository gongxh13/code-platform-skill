/**
 * ConfigPathError 测试
 */

const { describe, it, expect } = require('@jest/globals');
const {
  ConfigSearchError,
  PermissionError,
  ConfigNotFoundError,
  ConfigParseError,
  SearchStrategyError,
  CacheError
} = require('../../../src/config/path-resolver/config-path-error');

describe('ConfigPathError', () => {
  describe('ConfigSearchError', () => {
    it('应该创建基础错误实例', () => {
      const error = new ConfigSearchError('测试错误');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ConfigSearchError);
      expect(error.name).toBe('ConfigSearchError');
      expect(error.message).toBe('测试错误');
      expect(error.timestamp).toBeDefined();
      expect(error.searchContext).toEqual({});
    });
    
    it('应该包含搜索上下文', () => {
      const searchContext = { configName: 'test.json', startDir: '/test' };
      const error = new ConfigSearchError('测试错误', searchContext);
      
      expect(error.searchContext).toBe(searchContext);
    });
    
    it('应该保持正确的堆栈跟踪', () => {
      const error = new ConfigSearchError('测试错误');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ConfigSearchError');
    });
  });
  
  describe('PermissionError', () => {
    it('应该创建权限错误实例', () => {
      const filePath = '/etc/config.json';
      const error = new PermissionError(filePath);
      
      expect(error).toBeInstanceOf(ConfigSearchError);
      expect(error.name).toBe('PermissionError');
      expect(error.filePath).toBe(filePath);
      expect(error.message).toBe(`权限不足，无法访问配置文件: ${filePath}`);
    });
    
    it('应该包含搜索上下文', () => {
      const filePath = '/etc/config.json';
      const searchContext = { configName: 'config.json' };
      const error = new PermissionError(filePath, searchContext);
      
      expect(error.searchContext).toBe(searchContext);
    });
  });
  
  describe('ConfigNotFoundError', () => {
    it('应该创建配置未找到错误实例', () => {
      const configName = 'config.json';
      const error = new ConfigNotFoundError(configName);
      
      expect(error).toBeInstanceOf(ConfigSearchError);
      expect(error.name).toBe('ConfigNotFoundError');
      expect(error.configName).toBe(configName);
      expect(error.message).toBe(`配置文件未找到: ${configName}`);
      expect(error.searchedPaths).toEqual([]);
    });
    
    it('应该包含搜索过的路径', () => {
      const configName = 'config.json';
      const searchedPaths = ['/path1', '/path2'];
      const searchContext = { searchedPaths };
      const error = new ConfigNotFoundError(configName, searchContext);
      
      expect(error.searchedPaths).toBe(searchedPaths);
    });
  });
  
  describe('ConfigParseError', () => {
    it('应该创建配置解析错误实例', () => {
      const filePath = '/config.json';
      const originalError = new Error('JSON解析错误');
      const error = new ConfigParseError(filePath, originalError);
      
      expect(error).toBeInstanceOf(ConfigSearchError);
      expect(error.name).toBe('ConfigParseError');
      expect(error.filePath).toBe(filePath);
      expect(error.originalError).toBe(originalError);
      expect(error.message).toBe(`配置文件解析失败: ${filePath} - ${originalError.message}`);
    });
    
    it('应该包含搜索上下文', () => {
      const filePath = '/config.json';
      const originalError = new Error('JSON解析错误');
      const searchContext = { configName: 'config.json' };
      const error = new ConfigParseError(filePath, originalError, searchContext);
      
      expect(error.searchContext).toBe(searchContext);
    });
  });
  
  describe('SearchStrategyError', () => {
    it('应该创建搜索策略错误实例', () => {
      const strategyName = 'TestStrategy';
      const originalError = new Error('策略执行失败');
      const error = new SearchStrategyError(strategyName, originalError);
      
      expect(error).toBeInstanceOf(ConfigSearchError);
      expect(error.name).toBe('SearchStrategyError');
      expect(error.strategyName).toBe(strategyName);
      expect(error.originalError).toBe(originalError);
      expect(error.message).toBe(`搜索策略执行失败: ${strategyName} - ${originalError.message}`);
    });
  });
  
  describe('CacheError', () => {
    it('应该创建缓存错误实例', () => {
      const message = '缓存操作失败';
      const originalError = new Error('内部错误');
      const error = new CacheError(message, originalError);
      
      expect(error).toBeInstanceOf(ConfigSearchError);
      expect(error.name).toBe('CacheError');
      expect(error.originalError).toBe(originalError);
      expect(error.message).toBe(`缓存操作失败: ${message}`);
    });
    
    it('应该包含搜索上下文', () => {
      const message = '缓存操作失败';
      const originalError = new Error('内部错误');
      const searchContext = { cacheKey: 'test-key' };
      const error = new CacheError(message, originalError, searchContext);
      
      expect(error.searchContext).toBe(searchContext);
    });
  });
  
  describe('错误继承链', () => {
    it('所有错误都应该继承自 ConfigSearchError', () => {
      const errors = [
        new PermissionError('/test'),
        new ConfigNotFoundError('test.json'),
        new ConfigParseError('/test.json', new Error()),
        new SearchStrategyError('Test', new Error()),
        new CacheError('test', new Error())
      ];
      
      errors.forEach(error => {
        expect(error).toBeInstanceOf(ConfigSearchError);
        expect(error).toBeInstanceOf(Error);
      });
    });
  });
});