// @ts-nocheck

import { Order } from '../../../config/mdb';

//get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('assignedTo').populate('orderBy');
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//update an order
export const updateOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findByIdAndUpdate(orderId, req.body, { new: true });
    return res.status(200).json({ order });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
