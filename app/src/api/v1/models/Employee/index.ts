import mongoose, { Schema } from 'mongoose';

const EmployeeSchema = new Schema<any>(
  {
    username: String,
    sales: {
      type: Number,
      default: 0,
    },
    time_on_phone: {
      type: Number,
      default: 0,
    },
    calls: {
      type: Number,
      default: 0,
    },
    emails: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Employee = mongoose.model('Employee', EmployeeSchema);
export default Employee;
