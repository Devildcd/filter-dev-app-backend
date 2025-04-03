import User from "../models/userModel.js";

class UserService {
  static async findActiveUsers() {
    return await User.find({ is_active: true });
  }
}
