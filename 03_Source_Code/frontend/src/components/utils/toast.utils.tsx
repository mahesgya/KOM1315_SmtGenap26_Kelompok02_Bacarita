import { toast } from "react-hot-toast";

export const showToastSuccess = (message: string) => {
  toast.success(message, {
    style: {
      borderRadius: "12px",
      background: "#FBF8F2",
      color: "#5A3E2B",
      border: "1px solid #DE954F",
    },
    iconTheme: {
      primary: "#DE954F",
      secondary: "#FBF8F2",
    },
  });
};

export const showToastError = (message: string) => {
  toast.error(message, {
    style: {
      borderRadius: "12px",
      background: "#FBF8F2",
      color: "#5A3E2B",
      border: "1px solid #DE954F",
    },
    iconTheme: {
      primary: "#DE954F",
      secondary: "#FBF8F2",
    },
  });
};
