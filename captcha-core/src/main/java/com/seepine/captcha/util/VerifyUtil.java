package com.seepine.captcha.util;

import com.anji.captcha.model.common.Const;
import com.anji.captcha.model.common.ResponseModel;
import com.anji.captcha.model.vo.CaptchaVO;
import com.anji.captcha.service.CaptchaService;
import com.seepine.captcha.enums.RepCodeType;
import com.seepine.captcha.exception.CaptchaVerifyException;
import com.seepine.captcha.properties.AjCaptchaProperties;
import com.seepine.tool.util.Objects;
import java.util.Properties;

/**
 * @author seepine
 */
public class VerifyUtil {
  /** 从请求头中校验验证码值 */
  public static boolean verify(CaptchaService captchaService, String CaptchaVerification)
      throws CaptchaVerifyException {
    if (Objects.isEmpty(CaptchaVerification)) {
      throw new CaptchaVerifyException(RepCodeType.BLANK_ERROR);
    }
    CaptchaVO captchaVO = new CaptchaVO();
    captchaVO.setCaptchaVerification(CaptchaVerification);
    ResponseModel response = captchaService.verification(captchaVO);
    if (response.isSuccess()) {
      return true;
    }
    throw new CaptchaVerifyException(response.getRepMsg(), response.getRepCode());
  }

  public static Properties buildConfig(AjCaptchaProperties captchaProperties) {
    Properties config = new Properties();
    config.put(Const.CAPTCHA_CACHETYPE, captchaProperties.getCacheType().name());
    config.put(Const.CAPTCHA_WATER_MARK, captchaProperties.getWaterMark());
    config.put(Const.CAPTCHA_FONT_TYPE, captchaProperties.getFontType());
    config.put(Const.CAPTCHA_TYPE, captchaProperties.getType().getCodeValue());
    config.put(Const.CAPTCHA_INTERFERENCE_OPTIONS, captchaProperties.getInterferenceOptions());
    config.put(Const.ORIGINAL_PATH_JIGSAW, captchaProperties.getJigsaw());
    config.put(Const.ORIGINAL_PATH_PIC_CLICK, captchaProperties.getPicClick());
    config.put(Const.CAPTCHA_SLIP_OFFSET, captchaProperties.getSlipOffset());
    config.put(Const.CAPTCHA_AES_STATUS, String.valueOf(captchaProperties.getAesStatus()));
    config.put(Const.CAPTCHA_WATER_FONT, captchaProperties.getWaterFont());
    config.put(Const.CAPTCHA_CACAHE_MAX_NUMBER, captchaProperties.getCacheNumber());
    config.put(Const.CAPTCHA_TIMING_CLEAR_SECOND, captchaProperties.getTimingClear());
    config.put(
        Const.HISTORY_DATA_CLEAR_ENABLE,
        Boolean.TRUE.equals(captchaProperties.getHistoryDataClearEnable()) ? "1" : "0");

    config.put(
        Const.REQ_FREQUENCY_LIMIT_ENABLE,
        Boolean.TRUE.equals(captchaProperties.getReqFrequencyLimitEnable()) ? "1" : "0");
    config.put(Const.REQ_GET_LOCK_LIMIT, captchaProperties.getReqGetLockLimit() + "");
    config.put(Const.REQ_GET_LOCK_SECONDS, captchaProperties.getReqGetLockSeconds() + "");
    config.put(Const.REQ_GET_MINUTE_LIMIT, captchaProperties.getReqGetMinuteLimit() + "");
    config.put(Const.REQ_CHECK_MINUTE_LIMIT, captchaProperties.getReqCheckMinuteLimit() + "");
    config.put(Const.REQ_VALIDATE_MINUTE_LIMIT, captchaProperties.getReqVerifyMinuteLimit() + "");

    config.put(Const.CAPTCHA_FONT_SIZE, captchaProperties.getFontSize() + "");
    config.put(Const.CAPTCHA_FONT_STYLE, captchaProperties.getFontStyle() + "");
    config.put(Const.CAPTCHA_WORD_COUNT, captchaProperties.getClickWordCount() + "");
    return config;
  }
}
