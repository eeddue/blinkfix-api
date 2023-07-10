import mongoose, { Schema } from 'mongoose';

const ProviderEmployeeSchema = new Schema<any>(
  {
    username: String,
    employer: Schema.Types.ObjectId,
    tips: {
      Type: Number,
      default: 0,
    },
    type: String,
    orders: {
      Type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const ProviderEmployee = mongoose.model('ProviderEmployee', ProviderEmployeeSchema);
export default ProviderEmployee;
