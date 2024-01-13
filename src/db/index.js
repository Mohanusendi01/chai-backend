import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionIntance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionIntance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB CONNECTION ERROR: ", error);
    process.exit(1);
  }
};
export default connectDB;
