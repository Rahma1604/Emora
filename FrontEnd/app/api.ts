import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  "https://manga-cars-ciao-span.trycloudflare.com/api";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    Accept: "application/json",
  },
});

API.interceptors.request.use(
  async (config) => {
    try {
      const normalToken =
        await AsyncStorage.getItem("token");

      const verificationToken =
        await AsyncStorage.getItem(
          "verificationToken"
        );

      const requestUrl = String(
        config.url || ""
      );

      const isDoctorVerificationRequest =
        requestUrl.includes(
          "/auth/doctor-verification"
        );

      /*
        صفحات توثيق الدكتور تستخدم
        verificationToken.

        باقي صفحات التطبيق تستخدم
        token العادي بعد تسجيل الدخول.
      */
      const selectedToken =
        isDoctorVerificationRequest
          ? verificationToken
          : normalToken;

      /*
        لو الصفحة أرسلت Authorization
        بنفسها، لا نستبدله.
      */
      if (
        selectedToken &&
        !config.headers.Authorization
      ) {
        config.headers.Authorization =
          `Bearer ${selectedToken}`;
      }

      console.log("API Request:", {
        method:
          config.method?.toUpperCase(),

        url:
          `${config.baseURL || ""}` +
          `${config.url || ""}`,

        tokenType:
          isDoctorVerificationRequest
            ? "verificationToken"
            : "token",

        tokenExists:
          Boolean(selectedToken),
      });

      return config;
    } catch (error) {
      console.log(
        "API token loading error:",
        error
      );

      return config;
    }
  },
  (error) => {
    console.log(
      "API request error:",
      error
    );

    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      status: response.status,

      url:
        `${response.config.baseURL || ""}` +
        `${response.config.url || ""}`,
    });

    return response;
  },
  (error) => {
    console.log("API Error Details:", {
      message: error.message,

      status:
        error.response?.status,

      data:
        error.response?.data,

      url:
        `${error.config?.baseURL || ""}` +
        `${error.config?.url || ""}`,
    });

    return Promise.reject(error);
  }
);

export default API;