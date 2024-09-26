package com.seepine.captcha.spring.controller;

import com.anji.captcha.model.common.ResponseModel;
import com.anji.captcha.model.vo.CaptchaVO;
import com.anji.captcha.service.CaptchaService;
import com.seepine.tool.util.IpUtil;
import com.seepine.tool.util.Objects;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/captcha")
public class CaptchaController {

  @Resource private CaptchaService captchaService;

  @PostMapping("/get")
  public ResponseModel get(@RequestBody CaptchaVO data, HttpServletRequest request) {
    data.setBrowserInfo(getBrowserInfo(request));
    return captchaService.get(data);
  }

  @PostMapping("/check")
  public ResponseModel check(@RequestBody CaptchaVO data, HttpServletRequest request) {
    data.setBrowserInfo(getBrowserInfo(request));
    return captchaService.check(data);
  }

  public static String getBrowserInfo(HttpServletRequest request) {
    String ip =
        IpUtil.getIp(
            request.getHeader("X-Forwarded-For"),
            request.getHeader("Proxy-Client-IP"),
            request.getHeader("WL-Proxy-Client-IP"),
            request.getRemoteAddr());
    String ua = request.getHeader("user-agent");
    if (Objects.nonBlank(ip)) {
      return ip + ua;
    }
    return ua;
  }
}
