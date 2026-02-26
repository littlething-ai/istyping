export const isLocalEnv = (hostname: string) => {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.")
  );
};

export const getSocketUrl = (hostname: string) => {
  if (isLocalEnv(hostname)) {
    return `http://${hostname}:2020`;
  }
  return "http://backend.istyping.app:2020";
};
