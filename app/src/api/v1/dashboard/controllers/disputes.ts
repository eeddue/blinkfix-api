// @ts-nocheck

import Dispute from '../../models/Dispute';

//create dispute
export const createDispute = async (req, res) => {
  try {
    const dispute = await Dispute.create(req.body);
    return res.status(200).json({ msg: 'Your dispute has been submitted. We are on it.', dispute });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//get disputes
export const getDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find().populate('user');
    return res.status(200).json({ disputes });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//update dispute
export const updateDispute = async (req, res) => {
  const { disputeId } = req.params;
  try {
    const dispute = await Dispute.findByIdAndUpdate(disputeId, req.body, { new: true });
    return res.status(200).json({ msg: 'Dispute updated successfully', dispute });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//update dispute messages
export const sendMessage = async (req, res) => {
  const { disputeId } = req.params;
  const { message, sender } = req.body;
  try {
    const data = {
      message,
      sender,
      createdAt: Date.now(),
    };
    await Dispute.findByIdAndUpdate(disputeId, {
      $push: {
        messages: data,
      },
    });

    return res.status(200).json({ msg: 'Message sent successfully', message: data });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
