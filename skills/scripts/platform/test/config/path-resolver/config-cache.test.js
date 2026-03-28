/**
 * ConfigCache 测试
 */

const { describe, it, beforeEach } = require('@jest/globals');
const ConfigCache = require('../../../src/config/path-resolver/config-cache');

describe('ConfigCache', () => {
  let cache;
  
  beforeEach(() => {
    cache = new ConfigCache({
      maxSize: 3,
      maxAge: 1000 // 1秒，便于测试过期
    });
  });
  
  describe('构造函数', () => {
    it('应该使用默认配置创建实例', () => {
      const defaultCache = new ConfigCache();
      expect(defaultCache.maxSize).toBe(100);
      expect(defaultCache.maxAge).toBe(300000);
    });
    
    it('应该接受自定义配置', () => {
      expect(cache.maxSize).toBe(3);
      expect(cache.maxAge).toBe(1000);
    });
  });
  
  describe('get 和 set 方法', () => {
    it('应该存储和检索值', () => {
      cache.set('key1', 'value1');
      const value = cache.get('key1');
      expect(value).toBe('value1');
    });
    
    it('应该返回 null 当键不存在时', () => {
      const value = cache.get('non-existent');
      expect(value).toBeNull();
    });
    
    it('应该增加命中次数', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });
    
    it('应该增加未命中次数', () => {
      cache.get('non-existent1');
      cache.get('non-existent2');
      
      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });
    
    it('应该存储元数据', () => {
      const metadata = { strategy: 'test', timestamp: Date.now() };
      cache.set('key1', 'value1', metadata);
      
      // 通过内部结构检查元数据
      const entry = cache.cache.get('key1');
      expect(entry.metadata.strategy).toBe('test');
    });
  });
  
  describe('缓存过期', () => {
    it('应该使过期的条目失效', async () => {
      cache.set('key1', 'value1');
      
      // 等待条目过期
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const value = cache.get('key1');
      expect(value).toBeNull();
    });
    
    it('应该清理过期的条目', async () => {
      cache.set('key1', 'value1');
      
      // 等待条目过期
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const cleanedCount = cache.cleanup();
      expect(cleanedCount).toBe(1);
      
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });
  
  describe('缓存驱逐 (LRU)', () => {
    it('应该在达到最大大小时驱逐条目', () => {
      // 添加4个条目，但最大大小是3
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(3); // 应该只保留3个条目
    });
    
    it('应该使用LRU策略驱逐最旧的条目', () => {
      // 添加3个条目
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // 访问key1和key3，使key2成为最不常用的
      cache.get('key1');
      cache.get('key3');
      
      // 添加第4个条目，应该驱逐key2
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull(); // 应该被驱逐
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });
  
  describe('缓存管理', () => {
    it('应该删除特定条目', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
    
    it('应该清空所有条目', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
    
    it('应该返回正确的统计信息', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // 命中
      cache.get('key2'); // 未命中
      
      const stats = cache.getStats();
      expect(stats).toEqual({
        hits: 1,
        misses: 1,
        hitRate: 0.5,
        size: 1,
        maxSize: 3,
        maxAge: 1000
      });
    });
  });
});