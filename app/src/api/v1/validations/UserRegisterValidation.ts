import Joi from 'joi';

// export const userRegisreValidation = Joi.object({
//   first_name: Joi.string().alphanum().min(3).max(30).required().messages({
//     'any.required': '{{#label}} is required',
//     'string.empty': "{{#label}} can't be empty!!",
//   }),
//   last_name: Joi.string().alphanum().min(3).max(30).required(),
//   email: Joi.string().email().required(),
//   phone_number: Joi.string().required(),
//   password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
//   repeat_password: Joi.ref('password'),
//   address: Joi.string().required(),
//   postal_code: Joi.string().required(),
//   town: Joi.string().required(),
//   birth_year: Joi.number().integer().min(1900).max(2013),
//   userRole: Joi.string().valid('End User', 'Student', 'Local Cook', 'Restuarant', 'Food trucks', 'Shop'),
// });
