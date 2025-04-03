import mongoose from "mongoose";
import validator from "validator";

const visitSchema = new mongoose.Schema(
  {
    developer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ip_address: {
      type: String,
      required: true,
      validate: {
        validator: (ip) => validator.isIP(ip),
        message: "Invalid IP address format",
      },
    },
  },
  { timestamps: true, versionKey: false }
);

visitSchema.index({ developer_id: 1, user_id: 1, ip_address: 1, timestamp: 1 }, { unique: true });

const Visit = mongoose.model("Visit", visitSchema);
export default Visit;
