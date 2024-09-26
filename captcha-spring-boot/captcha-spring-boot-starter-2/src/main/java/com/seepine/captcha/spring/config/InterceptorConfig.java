package com.seepine.captcha.spring.config;

import com.anji.captcha.service.CaptchaService;
import com.seepine.captcha.spring.interceptor.CaptchaInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.annotation.Resource;

/**
 * @author seepine
 */
@Configuration
public class InterceptorConfig implements WebMvcConfigurer {
  @Resource
  private CaptchaService captchaService;

  @Override
  public void addInterceptors(@NonNull InterceptorRegistry registry) {
    registry
        .addInterceptor(new CaptchaInterceptor(captchaService))
        .addPathPatterns("/**")
        .order(Integer.MIN_VALUE + 100);
  }
}
