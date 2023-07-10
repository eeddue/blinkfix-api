import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';

const stripe = require('stripe')(
  'sk_test_51KEGezEn6xUPj18MgLOP19lYqt1LKi1muyTvA3YZ14mmULqz9MgAEOlXikhED0Iw03DDHgTVWXxgt8wGtUYbGSYW00iEc4s24Z',
);
export const postNewPayment = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const { items } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateOrderAmount(items),
      currency: 'pln',
      automatic_payment_methods: {
        enabled: true,
      },
    });
    res.status(200).send({ data: paymentIntent, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const calculateOrderAmount = (items: any) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};
