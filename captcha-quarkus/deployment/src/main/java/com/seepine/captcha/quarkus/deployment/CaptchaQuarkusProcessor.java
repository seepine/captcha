package com.seepine.captcha.quarkus.deployment;

import io.quarkus.deployment.annotations.BuildStep;
import io.quarkus.deployment.builditem.ExtensionSslNativeSupportBuildItem;
import io.quarkus.deployment.builditem.FeatureBuildItem;

class CaptchaQuarkusProcessor {
  private static final String FEATURE = "captcha";

  @BuildStep
  FeatureBuildItem feature() {
    return new FeatureBuildItem(FEATURE);
  }

  @BuildStep
  public ExtensionSslNativeSupportBuildItem enableSsl() {
    return new ExtensionSslNativeSupportBuildItem(FEATURE);
  }
}
