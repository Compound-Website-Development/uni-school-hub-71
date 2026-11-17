/** Remembers on this device that the phone belongs to a pupil, so sign-in opens in pupil mode. */
const KEY = "im_device_mode";
export type DeviceMode = "child" | "family";
export const getDeviceMode = (): DeviceMode => (localStorage.getItem(KEY) === "child" ? "child" : "family");
export const setDeviceMode = (mode: DeviceMode) => localStorage.setItem(KEY, mode);
