import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Echo',
  slug: 'echo-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'echoapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.echo.widget',
    entitlements: {
      "com.apple.security.application-groups": [
        "group.com.echo.widget"
      ]
    },
    infoPlist: {
      UIBackgroundModes: ['audio', 'fetch', 'remote-notification'],
      NSMicrophoneUsageDescription: "Echo needs microphone access to let you record audio messages."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.echo.widget',
    permissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.VIBRATE"
    ]
  },
  plugins: [
    "expo-router",
    [
      "expo-av",
      {
        "microphonePermission": "Allow Echo to access your microphone."
      }
    ]
    // Sentry, Firebase, and Custom Widget module will be appended here
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    eas: {
      projectId: "replace-with-your-eas-project-id"
    }
  }
});
