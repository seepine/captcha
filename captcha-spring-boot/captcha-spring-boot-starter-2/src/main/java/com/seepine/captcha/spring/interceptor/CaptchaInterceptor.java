package com.seepine.captcha.spring.interceptor;

import com.anji.captcha.service.CaptchaService;
import com.seepine.captcha.annotation.CaptchaVerify;
import com.seepine.captcha.util.VerifyUtil;
import com.seepine.tool.util.AnnotationUtil;
import java.lang.reflect.Method;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * PermissionInterceptor
 *
 * @author seepine
 * @since 1.0.0
 */
public class CaptchaInterceptor implements HandlerInterceptor {
  private final CaptchaService captchaService;

  public CaptchaInterceptor(CaptchaService captchaService) {
    this.captchaService = captchaService;
  }

  @Override
  public boolean preHandle(
      @NonNull HttpServletRequest httpServletRequest,
      @NonNull HttpServletResponse httpServletResponse,
      @NonNull Object handler) {
    if (!(handler instanceof HandlerMethod)) {
      return true;
    }
    HandlerMethod handlerMethod = (HandlerMethod) handler;
    Method method = handlerMethod.getMethod();
    CaptchaVerify verify = AnnotationUtil.getAnnotation(method, CaptchaVerify.class);
    if (verify == null) {
      return true;
    }
    return VerifyUtil.verify(captchaService, httpServletRequest.getHeader(verify.value()));
  }
}
