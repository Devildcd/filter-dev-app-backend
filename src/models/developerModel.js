import mongoose from "mongoose";
import validator from "validator";

const isValidUser = async (userId) => mongoose.model("User").exists({ _id: userId });

const developerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      validate: [isValidUser, "Referenced user does not exist"],
    },
    wallet_address: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (value) => /^([1-9A-HJ-NP-Za-km-z]{32,44})$/.test(value), // Validación para direcciones Solana
        message: "Invalid Solana wallet address",
      },
    },
    social_links: {
      type: Map,
      of: String,
      default: () => new Map(),
      validate: {
        validator: (links) =>
          !links || links.size === 0 || [...links.values()].every((url) => validator.isURL(url, { require_protocol: true })),
        message: "One or more social links contain invalid URLs",
      },
    },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    verified: { type: Boolean, default: false, index: true },
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret._id;
        ret.social_links = Object.fromEntries(ret.social_links || []);
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/** 🔹 Métodos de instancia */
developerSchema.methods = {
  async verify() {
    if (!this.verified) {
      this.verified = true;
      return this.save();
    }
  },
  async unverify() {
    if (this.verified) {
      this.verified = false;
      return this.save();
    }
  },
  async addProject(projectId) {
    if (!this.projects.includes(projectId)) {
      this.projects.push(projectId);
      return this.save();
    }
  },
  async removeProject(projectId) {
    this.projects = this.projects.filter((id) => id.toString() !== projectId.toString());
    return this.save();
  },
};

/** 🔹 Métodos estáticos */
developerSchema.statics = {
  async getVerifiedDevelopers() {
    return this.find({ verified: true });
  },
  async findByUserId(userId) {
    return this.findOne({ user_id: userId });
  },
};

const Developer = mongoose.model("Developer", developerSchema);
export default Developer;
