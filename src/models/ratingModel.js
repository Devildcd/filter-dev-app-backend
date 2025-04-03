import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
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
        validator: async function (developerId) {
          return await mongoose.model("Developer").exists({ _id: developerId });
        },
        message: "Referenced developer does not exist",
      },
    },
    score: {
      type: Number,
      required: true,
      min: [1, "Score must be at least 1"],
      max: [5, "Score cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔹 Índices para mejorar rendimiento en búsquedas
ratingSchema.index({ user_id: 1 });
ratingSchema.index({ developer_id: 1 });

/** 🔹 Métodos de instancia */
ratingSchema.methods = {
  async updateScore(newScore) {
    if (newScore < 1 || newScore > 5)
      throw new Error("Score must be between 1 and 5");
    this.score = newScore;
    return this.save();
  },
  async updateComment(newComment) {
    this.comment = newComment?.trim().slice(0, 500) || "";
    return this.save();
  },
};

/** 🔹 Métodos estáticos */
ratingSchema.statics = {
  async getAverageRating(developerId) {
    const result = await this.aggregate([
      {
        $match: {
          developer_id: new mongoose.Types.ObjectId(String(developerId)),
        },
      },
      { $group: { _id: "$developer_id", avgScore: { $avg: "$score" } } },
    ]);
    return result[0]?.avgScore || 0;
  },
  async getRatingsForDeveloper(developerId) {
    return this.find({ developer_id: developerId }).populate(
      "user_id",
      "name"
    );
  },
};

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
