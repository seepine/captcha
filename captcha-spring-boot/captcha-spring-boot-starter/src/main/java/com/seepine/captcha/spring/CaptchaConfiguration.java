package com.seepine.captcha.spring;

import com.anji.captcha.model.common.Const;
import com.anji.captcha.service.CaptchaService;
import com.anji.captcha.service.impl.CaptchaServiceFactory;
import com.anji.captcha.util.FileCopyUtils;
import com.anji.captcha.util.ImageUtils;
import com.seepine.captcha.spring.properties.CaptchaPropertiesImpl;
import com.seepine.captcha.util.VerifyUtil;
import com.seepine.tool.secure.symmetric.Base64;
import com.seepine.tool.util.Objects;
import jakarta.annotation.Resource;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;

/**
 * @author seepine
 */
@Configuration
@EnableConfigurationProperties({CaptchaPropertiesImpl.class})
public class CaptchaConfiguration {
  @Resource private CaptchaPropertiesImpl captchaProperties;

  /**
   * 填充authService
   *
   * @return DefaultTokenServiceImpl
   */
  @Bean
  @ConditionalOnMissingBean(CaptchaService.class)
  public CaptchaService captchaService() {
    Properties config = VerifyUtil.buildConfig(captchaProperties);
    if ((Objects.nonBlank(captchaProperties.getJigsaw())
            && captchaProperties.getJigsaw().startsWith("classpath:"))
        || (Objects.nonBlank(captchaProperties.getPicClick())
            && captchaProperties.getPicClick().startsWith("classpath:"))) {
      // 自定义resources目录下初始化底图
      config.put(Const.CAPTCHA_INIT_ORIGINAL, "true");
      initializeBaseMap(captchaProperties.getJigsaw(), captchaProperties.getPicClick());
    }
    return CaptchaServiceFactory.getInstance(config);
  }

  private static void initializeBaseMap(String jigsaw, String picClick) {
    ImageUtils.cacheBootImage(
        getResourcesImagesFile(jigsaw + "/original/*.png"),
        getResourcesImagesFile(jigsaw + "/slidingBlock/*.png"),
        getResourcesImagesFile(picClick + "/*.png"));
  }

  private static Map<String, String> getResourcesImagesFile(String path) {
    Map<String, String> imgMap = new HashMap<>();
    ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
    try {
      org.springframework.core.io.Resource[] resources = resolver.getResources(path);
      for (org.springframework.core.io.Resource resource : resources) {
        byte[] bytes = FileCopyUtils.copyToByteArray(resource.getInputStream());
        String string = Base64.encode(bytes);
        String filename = resource.getFilename();
        imgMap.put(filename, string);
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
    return imgMap;
  }
}
