package com.seepine.captcha.exception;

import com.seepine.captcha.enums.RepCodeType;
import com.seepine.tool.exception.RunException;
import lombok.Getter;

/**
 * CaptchaVerify Exception
 *
 * @author seepine
 */
@Getter
public class CaptchaVerifyException extends RunException {

  private final String repCode;
  private final RepCodeType repCodeType;

  public CaptchaVerifyException(RepCodeType repCodeType) {
    super(repCodeType.getDesc());
    this.repCode = repCodeType.getCode();
    this.repCodeType = repCodeType;
  }

  public CaptchaVerifyException(String message, String repCode) {
    super(message);
    this.repCode = repCode;
    this.repCodeType = RepCodeType.from(repCode);
  }

  @Override
  public String getMessage() {
    return super.getMessage().replace("{0}", "验证码");
  }
}
