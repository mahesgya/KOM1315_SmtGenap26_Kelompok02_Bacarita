import Swal, { SweetAlertIcon } from "sweetalert2";

const baseSwalStyles = {
  background: "#FBF8F2",
  color: "#5A3E2B",
  confirmButtonColor: "#DE954F",
  cancelButtonColor: "#5A3E2B",
  customClass: {
    popup: "rounded-[12px] border border-[#DE954F] !bg-[#FBF8F2] !text-[#5A3E2B]",
    title: "!text-[#5A3E2B] font-semibold",
    htmlContainer: "!text-[#5A3E2B]",
    confirmButton:
      "rounded-[8px] font-medium px-4 py-2 !bg-[#DE954F] !text-[#FBF8F2] border border-[#DE954F]",
    cancelButton:
      "rounded-[8px] font-medium px-4 py-2 !bg-[#FBF8F2] !text-[#5A3E2B] border border-[#5A3E2B]",
  },
};

export const showSwalSuccess = (message: string, title = "Berhasil") => {
  return Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonText: "OK",
    ...baseSwalStyles,
  });
};

export const showSwalError = (message: string, title = "Terjadi Kesalahan") => {
  return Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonText: "OK",
    ...baseSwalStyles,
  });
};

export const showSwalConfirm = ({
  title = "Konfirmasi",
  message = "Apakah kamu yakin?",
  confirmText = "Ya",
  cancelText = "Batal",
  icon = "warning",
}: {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: SweetAlertIcon;
}) => {
  return Swal.fire({
    icon,
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true, 
    ...baseSwalStyles,
  });
};
