package com.seepine.captcha.spring.properties;

import com.seepine.captcha.properties.AjCaptchaProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author seepine
 */
@ConfigurationProperties(prefix = "captcha")
public class CaptchaPropertiesImpl extends AjCaptchaProperties {}
