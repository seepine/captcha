package com.seepine.captcha.quarkus.runtime.filter;

import com.anji.captcha.service.CaptchaService;
import com.seepine.captcha.annotation.CaptchaVerify;
import com.seepine.captcha.util.VerifyUtil;
import com.seepine.tool.util.AnnotationUtil;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.ext.Provider;
import java.lang.reflect.Method;

/**
 * 权限过滤器，优先值比auth低
 *
 * @author seepine
 */
@Priority(Integer.MIN_VALUE + 100)
@Provider
public class CaptchaFilter implements ContainerRequestFilter {
  @Inject ResourceInfo resourceInfo;
  @Inject CaptchaService captchaService;

  @Override
  public void filter(ContainerRequestContext containerRequestContext) {
    Method method = resourceInfo.getResourceMethod();
    CaptchaVerify verify = AnnotationUtil.getAnnotation(method, CaptchaVerify.class);
    if (verify == null) {
      return;
    }
    VerifyUtil.verify(captchaService, containerRequestContext.getHeaderString(verify.value()));
  }
}
