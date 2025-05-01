import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
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
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      minlength: [5, "Message must be at least 5 characters long"],
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "date", updatedAt: false },
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices para optimizar las consultas
notificationSchema.index({ user_id: 1, date: -1 });
notificationSchema.index({ developer_id: 1, date: -1 });
notificationSchema.index({ read: 1, date: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;