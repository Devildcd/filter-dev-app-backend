import Visit from "../models/visitModel.js";

export const countVisits = async (developerId) => {
  try {
    if (!developerId) {
      throw new Error("Developer ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(developerId)) {
      throw new Error("Invalid Developer ID format");
    }

    const count = await Visit.countDocuments({ developer_id: developerId });
    return count;
  } catch (error) {
    console.error(`Error counting visits for developer ${developerId}:`, error);
    throw new Error("Failed to retrieve visit count");
  }
};

export const registerVisit = async (developerId, userId, ip) => {
  try {
    if (!developerId || !ip) {
      throw new Error("Developer ID and IP address are required");
    }

    if (!mongoose.Types.ObjectId.isValid(developerId)) {
      throw new Error("Invalid Developer ID format");
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const visit = await Visit.findOneAndUpdate(
      {
        developer_id: developerId,
        user_id: userId || null,
        ip_address: ip,
        timestamp: { $gte: twentyFourHoursAgo },
      },
      {
        $setOnInsert: {
          developer_id: developerId,
          user_id: userId || null,
          ip_address: ip,
          timestamp: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        lean: true,
      }
    );

    return visit;
  } catch (error) {
    console.error(
      `Error registering visit for developer ${developerId}:`,
      error
    );
    throw new Error("Failed to register visit");
  }
};
