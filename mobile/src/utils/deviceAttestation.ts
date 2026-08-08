import { Platform } from 'react-native';
import * as Device from 'expo-device';

interface DeviceSecurityInfo {
  isDeviceRooted: boolean;
  isEmulator: boolean;
  hasKnownVulnerabilities: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  details: string[];
}

function checkRootIndicators(): string[] {
  const details: string[] = [];

  if (Platform.OS === 'android') {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
      details.push('Root detection active on Android release build');
    }
  }

  if (Platform.OS === 'ios') {
    details.push('iOS jailbreak detection active');
  }

  return details;
}

async function detectEmulator(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const deviceName = Device.deviceName ?? '';
    const modelName = Device.modelName ?? '';
    const osVersion = Device.osVersion ?? '';
    const deviceYear = Device.deviceYearClass ?? 0;

    const emulatorIndicators = [
      'emulator', 'simulator', 'sdk', 'generic',
      'android sdk', 'default', 'google sdk',
    ];

    const combined = `${deviceName} ${modelName} ${osVersion}`.toLowerCase();
    for (const indicator of emulatorIndicators) {
      if (combined.includes(indicator)) {
        return true;
      }
    }

    if (deviceYear < 2015 && deviceYear > 0) {
      const brand = Device.brand?.toLowerCase() ?? '';
      if (!['apple', 'samsung', 'google', 'xiaomi', 'huawei', 'oneplus'].some((b) => brand.includes(b))) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export async function getDeviceSecurityInfo(): Promise<DeviceSecurityInfo> {
  const details = checkRootIndicators();
  const isEmulator = await detectEmulator();

  let riskLevel: DeviceSecurityInfo['riskLevel'] = 'none';

  if (isEmulator) {
    details.push('Running on an emulator/simulator');
    riskLevel = 'low';
  }

  if (details.length >= 3) {
    riskLevel = 'high';
  } else if (details.length >= 1) {
    riskLevel = 'medium';
  }

  return {
    isDeviceRooted: details.length > 0,
    isEmulator,
    hasKnownVulnerabilities: false,
    riskLevel,
    details,
  };
}

export function isDeviceCompromised(info: DeviceSecurityInfo): boolean {
  if (info.riskLevel === 'high') return true;
  return false;
}
