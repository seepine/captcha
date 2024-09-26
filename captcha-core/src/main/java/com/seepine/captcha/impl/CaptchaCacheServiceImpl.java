package com.seepine.captcha.impl;

import com.anji.captcha.service.CaptchaCacheService;
import com.seepine.tool.cache.Cache;

/**
 * 存储依赖 <a href="https://github.com/seepine/tool">seepine/tool</a> 的 Cache，具体可查看文档
 *
 * @author seepine
 * @date 2024-09-26
 */
public class CaptchaCacheServiceImpl implements CaptchaCacheService {

  @Override
  public String type() {
    return "local";
  }

  @Override
  public void set(String key, String value, long expiresInSeconds) {
    Cache.set(key, value, expiresInSeconds == 0 ? 60 * 60 * 1000 : expiresInSeconds * 1000);
  }

  @Override
  public boolean exists(String key) {
    return Cache.get(key) != null;
  }

  @Override
  public void delete(String key) {
    Cache.remove(key);
  }

  @Override
  public String get(String key) {
    return Cache.getStr(key);
  }

  @Override
  public Long increment(String key, long val) {
    Long ret = Long.parseLong(get(key)) + val;
    set(key, ret + "", 0);
    return ret;
  }
}
