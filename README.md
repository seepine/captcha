# captcha

行为验证码，支持 SpringBoot2.x、SpringBoot3.x、Quarkus3.x，基于 [anji-plus/captcha](https://github.com/anji-plus/captcha)

## 一、集成

### 1.引入依赖

- [captcha-spring-boot-starter](./captcha-spring-boot-starter)
- [captcha-quarkus](./captcha-quarkus)

## 二、基本使用

### 1.从请求头验证

登录接口使用注解 `@CaptchaVerify` ，获取请求头 `CaptchaVerification` 的验证码值自动验证

```java
public class Controller {
  @CaptchaVerify
  @GetMapping("/login/{username}/{password}")
  public AuthUser login(@PathVariable String username, @PathVariable String password) {
    AuthUser user = userService.getByUsername(username, password);
    return AuthUtil.login(user);
  }
}
```

### 2.手动验证

手动传递验证码值，使用 `captchaService` 验证

```java
public class Controller {
  @Resource CaptchaService captchaService;
  
  @GetMapping("/login/{username}/{password}")
  public AuthUser login(@PathVariable String username, @PathVariable String password, @RequestParam String captchaVerification) {
    // 验证未通过会抛出异常 CaptchaVerifyException
    VerifyUtil.verify(captchaService, captchaVerification);
    
    // 进行登录逻辑
    AuthUser user = userService.getByUsername(username, password);
    return AuthUtil.login(user);
  }
}
```

## 三、自定义参数

修改 `application.properties`，自定义底图和水印等等

```properties
# 滑动验证，底图路径，不配置将使用默认图片
# 支持全路径
# 支持项目路径,以classpath:开头,取resource目录下路径,例：classpath:images/jigsaw
captcha.jigsaw=classpath:images/jigsaw
#滑动验证，底图路径，不配置将使用默认图片
##支持全路径
# 支持项目路径,以classpath:开头,取resource目录下路径,例：classpath:images/pic-click
captcha.pic-click=classpath:images/pic-click
# 对于分布式部署的应用，可扩展 com.seepine.tool.cache.Cache，比如用 Redis
# 具体查看文档 https://github.com/seepine/tool?tab=readme-ov-file#cache

# 验证码类型default两种都实例化。
captcha.type=default
# 汉字统一使用Unicode,保证程序通过@value读取到是中文，可通过这个在线转换;yml格式不需要转换
# https://tool.chinaz.com/tools/unicode.aspx 中文转Unicode
# 右下角水印文字(我的水印)
captcha.water-mark=\u6211\u7684\u6c34\u5370
# 右下角水印字体(不配置时，默认使用文泉驿正黑)
# 由于宋体等涉及到版权，我们jar中内置了开源字体【文泉驿正黑】
# 方式一：直接配置OS层的现有的字体名称，比如：宋体
# 方式二：自定义特定字体，请将字体放到工程resources下fonts文件夹，支持ttf\ttc\otf字体
# captcha.water-font=WenQuanZhengHei.ttf
# 点选文字验证码的文字字体(文泉驿正黑)
# captcha.font-type=WenQuanZhengHei.ttf
# 校验滑动拼图允许误差偏移量(默认5像素)
captcha.slip-offset=5
# aes加密坐标开启或者禁用(true|false)
captcha.aes-status=true
# 滑动干扰项(0/1/2)
captcha.interference-options=2
#点选字体样式 默认Font.BOLD
captcha.font-style=1
#点选字体字体大小
captcha.font-size=25
#点选文字个数,存在问题，暂不支持修改
#captcha.click-word-count=4
captcha.history-data-clear-enable=false
# 接口请求次数一分钟限制是否开启 true|false
captcha.req-frequency-limit-enable=false
# 验证失败5次，get接口锁定
captcha.req-get-lock-limit=5
# 验证失败后，锁定时间间隔,s
captcha.req-get-lock-seconds=360
# get接口一分钟内请求数限制
captcha.req-get-minute-limit=30
# check接口一分钟内请求数限制
captcha.req-check-minute-limit=60
# verify接口一分钟内请求数限制
captcha.req-verify-minute-limit=60
```
