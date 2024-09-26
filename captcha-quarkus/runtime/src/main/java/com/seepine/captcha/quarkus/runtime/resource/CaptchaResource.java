package com.seepine.captcha.quarkus.runtime.resource;

import com.anji.captcha.model.common.ResponseModel;
import com.anji.captcha.model.vo.CaptchaVO;
import com.anji.captcha.service.CaptchaService;
import com.seepine.tool.util.IpUtil;
import com.seepine.tool.util.Objects;
import jakarta.annotation.Resource;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/captcha")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class CaptchaResource {

  @Resource private CaptchaService captchaService;

  @POST
  @Path("/get")
  public ResponseModel get(CaptchaVO data, @Context HttpHeaders headers) {
    data.setBrowserInfo(getBrowserInfo(headers));
    return captchaService.get(data);
  }

  @POST
  @Path("/check")
  public ResponseModel check(CaptchaVO data, @Context HttpHeaders headers) {
    data.setBrowserInfo(getBrowserInfo(headers));
    return captchaService.check(data);
  }

  public static String getBrowserInfo(HttpHeaders headers) {
    String ip =
        IpUtil.getIp(
            headers.getHeaderString("X-Forwarded-For"),
            headers.getHeaderString("Proxy-Client-IP"),
            headers.getHeaderString("WL-Proxy-Client-IP"),
            null);
    String ua = headers.getHeaderString("user-agent");
    String browserInfo;
    if (Objects.nonBlank(ip)) {
      browserInfo = ip + ua;
    } else {
      browserInfo = ua;
    }
    return browserInfo;
  }
}
