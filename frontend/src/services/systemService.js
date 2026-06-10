import axios from "axios";

export const executePowerAction = async (serverUrl, action, signal) => {
  const response = await axios.post(
    `${serverUrl}/api/system/power`,
    { action },
    {
      withCredentials: true,
      signal,
    }
  );

  return response.data;
};
