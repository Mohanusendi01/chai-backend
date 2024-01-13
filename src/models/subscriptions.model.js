import mongoose, { Schema } from "mongoose";

const subscriptionSchema = mongoose.Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, //one who is whom is "scriber" is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.Model("Subscription", subscriptionSchema);

export { Subscription };
