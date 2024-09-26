package com.seepine.captcha.quarkus.runtime.config;

import com.seepine.captcha.properties.AjCaptchaProperties;
import com.seepine.captcha.quarkus.runtime.properties.CaptchaPropertiesImpl;
import com.seepine.tool.R;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * @author seepine
 * @since 1.0.0
 */
@RegisterForReflection(targets = {AjCaptchaProperties.class, CaptchaPropertiesImpl.class, R.class})
public class ReflectionConfig {}
