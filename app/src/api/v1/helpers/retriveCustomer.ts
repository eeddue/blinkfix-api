import { IAddress } from '../interfaces/mongo/establishment';
import { stripe } from '../controllers/order/payment';

export const retriveCustomer = async (
  accountId: string,
  address: IAddress,
  first_name: string,
  last_name: string,
  email: string,
) => {
  const account = await stripe.accounts.retrieve(
    accountId, // ID of the connected account
    { expand: ['external_accounts'] }, // Optional parameters to expand the response
  );
  if (!account) {
    throw new Error('no account found');
  }

  return await stripe.customers.create({
    name: `${first_name} ${last_name}`,
    email: account.email ? account.email : email,
    address: {
      city: address.city,
      country: address.country,
      postal_code: address.postcode,
      state: address.state,
      line1: `${address.street}  ${address.buildingnumber}`,
    },
  });

  // o${ something with the customer
};
