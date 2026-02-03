import { useState } from "react";

const useAlert = () => {
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showAlert = (type:any, title:any, message:any, onConfirm = () => {}) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      onConfirm
    });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  return { alert, showAlert, closeAlert };
};

export default useAlert;
