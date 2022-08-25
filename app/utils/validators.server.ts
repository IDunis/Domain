export const validateEmail = (email: unknown): string | undefined => {
  var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (typeof email !== "string" || (!email.length || !validRegex.test(email))) {
    return "Please enter a valid email address"
  }
}

export const validatePassword = (password: unknown): string | undefined => {
  if (typeof password !== "string" || password.length < 6) {
    return `Password must be at least 6 characters long`;
  }
}

export const validateUsername = (name: unknown): string | undefined => {
  if (typeof name !== "string" || name.length < 3) {
    return `Username must be at least 3 characters long`;
  }
}

export const validateName = (name: unknown): string | undefined => {
  if (typeof name !== "string" || name.length === 0) {
    return `Field must be required`;
  }
}

export const validateUrl = (url: string): string => {
  let urls = ["/jokes", "/", "https://remix.run"];
  if (urls.includes(url)) {
    return url;
  }
  return "/jokes";
}