// @ts-nocheck
import Stripe from 'stripe';
export const getAllTransactions = async (req, res) => {
  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const transactions = await stripe.balanceTransactions.list();
    res.json(transactions.data);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
