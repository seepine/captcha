package com.seepine.captcha.quarkus.runtime.config;

import com.anji.captcha.service.CaptchaService;
import com.anji.captcha.service.impl.CaptchaServiceFactory;
import com.seepine.captcha.quarkus.runtime.properties.CaptchaPropertiesImpl;
import com.seepine.captcha.util.VerifyUtil;
import io.quarkus.arc.DefaultBean;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import jakarta.ws.rs.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperties;

/**
 * @author seepine
 */
public class AutoConfig {
  @Inject @ConfigProperties CaptchaPropertiesImpl captchaProperties;

  @Produces
  @DefaultBean
  @Singleton
  public CaptchaService captchaService() {
    return CaptchaServiceFactory.getInstance(VerifyUtil.buildConfig(captchaProperties));
  }
}
