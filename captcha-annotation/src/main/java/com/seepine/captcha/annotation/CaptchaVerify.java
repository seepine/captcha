package com.seepine.captcha.annotation;

import java.lang.annotation.*;

/**
 * 禁令，作用于方法上
 *
 * @author seepine
 * @code @CaptchaVerify("comment")，表示该接口需要验证请求头 CaptchaVerification 的值
 * @since 1.0.0
 */
@Documented
@Inherited
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface CaptchaVerify {
  /**
   * 请求头，默认CaptchaVerification
   *
   * @return 请求头
   */
  String value() default "CaptchaVerification";
}
