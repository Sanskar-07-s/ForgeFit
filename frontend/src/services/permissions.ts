// ForgeFit AI - Device Permission Solicitor Service (v4.3)

export interface PermissionStatusMap {
  notifications: boolean;
  camera: boolean;
  microphone: boolean;
  storage: boolean;
  health: boolean;
}

export const requestDevicePermission = async (
  permissionKey: keyof PermissionStatusMap
): Promise<boolean> => {
  try {
    switch (permissionKey) {
      case 'notifications':
        if (!('Notification' in window)) {
          console.warn('Browser does not support notifications.');
          return false;
        }
        
        // Request Native notification access
        const status = await Notification.requestPermission();
        return status === 'granted';

      case 'camera':
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('Camera media capture not supported on device.');
          return false;
        }
        // Attempt quick capture start to prompt permission dialogue
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Close stream instantly to avoid leaving camera light active
        cameraStream.getTracks().forEach(track => track.stop());
        return true;

      case 'microphone':
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('Microphone capture not supported on device.');
          return false;
        }
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(track => track.stop());
        return true;

      case 'storage':
        if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persist();
          return isPersisted;
        }
        return true; // fallback assume true

      case 'health':
        // Future Wearable / Health integration mock consent flow
        return new Promise((resolve) => {
          setTimeout(() => resolve(true), 600);
        });

      default:
        return false;
    }
  } catch (error) {
    console.warn(`Permission request failed for ${permissionKey}:`, error);
    return false;
  }
};

/**
 * Retrieves current browser permission configurations if query APIs are supported.
 */
export const checkCurrentPermissions = async (): Promise<PermissionStatusMap> => {
  const defaults: PermissionStatusMap = {
    notifications: false,
    camera: false,
    microphone: false,
    storage: false,
    health: false,
  };

  try {
    if ('Notification' in window) {
      defaults.notifications = Notification.permission === 'granted';
    }

    if (navigator.permissions && navigator.permissions.query) {
      // Query Camera
      try {
        const cam = await navigator.permissions.query({ name: 'camera' as any });
        defaults.camera = cam.state === 'granted';
      } catch (e) {}

      // Query Microphone
      try {
        const mic = await navigator.permissions.query({ name: 'microphone' as any });
        defaults.microphone = mic.state === 'granted';
      } catch (e) {}
    }
  } catch (err) {}

  return defaults;
};
