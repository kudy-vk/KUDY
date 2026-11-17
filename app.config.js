const { expo } = require('./app.json');

// PHONE-01 (#322, epic #95): EAS project created by `eas init` on 2026-11-17;
// a dynamic config cannot be written by the CLI, so the id is pinned here.
const easProjectId = 'b13fc99c-bf6d-45bc-9017-e689f4f9511d';

// The sample APK is a separate install, so it cannot replace a real KUDY app.
const demo = process.env.EXPO_PUBLIC_DEMO_MODE === '1';
// PHONE-01 (#322, epic #95): the phone-test build is a separate install too;
// the EAS `sandbox` profile sets EXPO_PUBLIC_SANDBOX=1 (eas.json env). Demo
// mode wins when both are set — one evaluation, one deterministic package.
const sandbox = !demo && process.env.EXPO_PUBLIC_SANDBOX === '1';

const withEasProjectId = (config) => ({
  ...config,
  extra: { ...(config.extra || {}), eas: { projectId: easProjectId } },
});

module.exports = {
  expo: demo ? {
    ...expo,
    name: 'KUDY Demo',
    slug: 'kudy-demo',
    icon: './assets/demo-icon.png',
    android: { ...expo.android, package: 'by.kudy.app.demo', icon: './assets/demo-icon.png', adaptiveIcon: undefined },
    ios: { ...expo.ios, bundleIdentifier: 'by.kudy.app.demo', icon: './assets/demo-icon.png' },
  } : withEasProjectId(sandbox ? {
    ...expo,
    name: 'KUDY Sandbox',
    android: { ...expo.android, package: 'by.kudy.app.sandbox' },
    ios: { ...expo.ios, bundleIdentifier: 'by.kudy.app.sandbox' },
  } : withEasProjectId(expo)),
};
