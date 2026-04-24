// src/utils/validateForm.js

export const validateForm = (form, rules) => {
  const errors = {};

  for (const field in rules) {
    const value = form[field];

    for (const rule of rules[field]) {
      if (!rule.validate(value)) {
        errors[field] = rule.message;
        break; // stop at first error
      }
    }
  }

  return errors;
};