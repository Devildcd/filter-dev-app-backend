import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
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
    },
    {
      timestamps: { createdAt: "date", updatedAt: false },
      versionKey: false,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // 🔹 Índices para optimizar queries
followSchema.index({ user_id: 1, developer_id: 1 }, { unique: true }); 
followSchema.index({ developer_id: 1 });
followSchema.index({ user_id: 1 });

const Follow = mongoose.model("Follow", followSchema);
export default Follow;