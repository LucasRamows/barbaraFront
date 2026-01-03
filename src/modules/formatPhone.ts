const formatPhone = (phone:string) => {
  let digits = phone.replace(/\D/g, "");
  digits = digits.slice(0, 11);
  let formatted = "";
  if (digits.length > 0) {
    if (digits.length <= 2) {
      formatted = `(${digits}`;
    } else if (digits.length <= 6) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(
        6
      )}`;
    } else {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
        7
      )}`;
    }
  }
  return formatted;
};

export default formatPhone;
