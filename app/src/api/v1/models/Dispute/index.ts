import mongoose, { Schema } from 'mongoose';

const DisputeSchema = new Schema<any>(
  {
    title: String,
    description: String,
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    messages: Array,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    images: [],
  },
  {
    timestamps: true,
  },
);

const Dispute = mongoose.model('Dispute', DisputeSchema);
export default Dispute;
