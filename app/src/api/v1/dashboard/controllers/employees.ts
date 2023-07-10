// @ts-nocheck

import Employee from '../../models/Employee';
import ProviderEmployee from '../../models/ProviderEmployee';

//get employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    return res.status(200).json({ employees });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//get provider employees
export const getProviderEmployees = async (req, res) => {
  try {
    const employees = await ProviderEmployee.find();
    return res.status(200).json({ employees });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
