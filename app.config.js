const { expo } = require('./app.json');

// The sample APK is a separate install, so it cannot replace a real KUDY app.
const demo = process.env.EXPO_PUBLIC_DEMO_MODE === '1';
// PHONE-01 (#322, epic #95): the phone-test build is a separate install too;
// the EAS `sandbox` profile sets EXPO_PUBLIC_SANDBOX=1 (eas.json env). Demo
// mode wins when both are set — one evaluation, one deterministic package.
const sandbox = !demo && process.env.EXPO_PUBLIC_SANDBOX === '1';
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
    slug: 'kudy-sandbox',
    android: { ...expo.android, package: 'by.kudy.app.sandbox' },
    ios: { ...expo.ios, bundleIdentifier: 'by.kudy.app.sandbox' },
  } : expo,
};
