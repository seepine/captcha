package com.seepine.captcha.quarkus.runtime.properties;

import com.seepine.captcha.properties.AjCaptchaProperties;
import org.eclipse.microprofile.config.inject.ConfigProperties;

/**
 * @author seepine
 */
@ConfigProperties(prefix = "captcha")
public class CaptchaPropertiesImpl extends AjCaptchaProperties {}
