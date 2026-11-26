const { expo } = require('./app.json');

// Demo and phone-test installations must not replace the production app.
const demo = process.env.EXPO_PUBLIC_DEMO_MODE === '1';
const sandbox = !demo && process.env.EXPO_PUBLIC_SANDBOX === '1';
const development = !demo && !sandbox && process.env.EXPO_PUBLIC_DEV_CLIENT_BUILD === '1';

module.exports = {
  expo: demo ? {
    ...expo,
    name: 'KUDY Demo',
    slug: 'kudy-demo',
    icon: './assets/demo-icon.png',
    android: { ...expo.android, package: 'by.kudy.app.demo', icon: './assets/demo-icon.png', adaptiveIcon: undefined },
    ios: { ...expo.ios, bundleIdentifier: 'by.kudy.app.demo', icon: './assets/demo-icon.png' },
  } : sandbox ? {
    ...expo,
    name: 'KUDY Sandbox',
    android: { ...expo.android, package: 'by.kudy.app.sandbox' },
    ios: { ...expo.ios, bundleIdentifier: 'by.kudy.app.sandbox' },
  } : development ? {
    ...expo,
    android: { ...expo.android, package: 'by.kudy.app.dev' },
    ios: { ...expo.ios, bundleIdentifier: 'by.kudy.app.dev' },
  } : expo,
};
