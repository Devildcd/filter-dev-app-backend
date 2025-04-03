import mongoose from "mongoose";
import validator from "validator";

const statusEnum = ["active", "inactive", "scam_reported"];

const performanceSchema = new mongoose.Schema(
  {
    daily_users: { type: Number, min: 0, default: 0 },
    transactions: { type: Number, min: 0, default: 0 },
    volume: { type: Number, min: 0, default: 0 },
    last_updated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    developer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
      validate: {
        validator: async function (developerId) {
          return await mongoose.model("Developer").exists({ _id: developerId });
        },
      },
    },
    launch_date: {
      type: Date,
      required: true,
      validate: {
        validator: (date) => date <= new Date(),
        message: "Launch date cannot be in the future",
      },
    },
    status: {
      type: String,
      enum: statusEnum,
      default: "active",
      index: true,
    },
    performance: {
      type: performanceSchema,
      default: () => ({}),
    },
    explorer_link: {
      type: String,
      validate: {
        validator: (url) =>
          validator.isURL(url, {
            protocols: ["http", "https"],
            require_protocol: true,
          }),
        message: "Invalid explorer URL. Must include http:// or https://",
      },
    },
  },
  {
    timestamps: true, 
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Middleware para actualizar la fecha de modificación
projectSchema.pre('save', function(next) {
    if (this.isModified()) {
      this.updated_at = new Date();
    }
    next();
  });

  // Índices para mejorar las búsquedas
projectSchema.index({ developer_id: 1, status: 1 });
projectSchema.index({ name: 'text' });

// Virtual para información del desarrollador
projectSchema.virtual('developer_info', {
    ref: 'Developer',
    localField: 'developer_id',
    foreignField: '_id',
    justOne: true,
    options: { select: 'id verified bio' }
  });

// Metodos de Instancia
projectSchema.statics = {
    getActiveProjects() {
        return this.find({status: 'active'}).sort({launch_date: -1});
    },
    findByDeveloper(developerId) {
        return this.find({developer_id: developerId});
    }
};

// Métodos de instancia
projectSchema.methods = {
    async markAsScam(reason) {
      this.status = 'scam_reported';
      this.scam_reported_reason = reason;
      return this.save();
    },
    async updatePerformance(stats) {
      Object.assign(this.performance, stats, { last_updated: new Date() });
      return this.save();
    }
  };
