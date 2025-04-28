import mongoose from "mongoose";
import validator from "validator";

const visitSchema = new mongoose.Schema(
  {
    developer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      required: [true, "Developer reference is required"],
      validate: {
        validator: async function (devId) {
          return await mongoose.model("Developer").exists({ _id: devId });
        },
        message: "Referenced developer does not exist",
      },
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      validate: {
        validator: async function (userId) {
          return await mongoose.model("User").exists({ _id: userId });
        },
        message: "Referenced user does not exist",
      },
    },
    ip_address: {
      type: String,
      required: [true, "IP address is required"],
      validate: {
        validator: function (ip) {
          // supports both IPv4 and IPv6
          return validator.isIP(ip);
        },
        message: "Invalid IP address",
      },
    },
  },
  {
    timestamps: true, versionKey: false, toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

visitSchema.index({ developer_id: 1, timestamp: -1 });
visitSchema.index({ user_id: 1, timestamp: -1 });
visitSchema.index({ ip_address: 1, timestamp: -1 });

const Visit = mongoose.model("Visit", visitSchema);
export default Visit;
