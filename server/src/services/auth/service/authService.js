import AppError from "../../../shared/utils/AppError.js";
import jwt from "jsonwebtoken";
import config from "../../../shared/config/index.js";
import logger from "../../../shared/config/logger.js";
import bcrypt from "bcryptjs";
import { APPLICATION_ROLES } from "../../../shared/constants/role.js";

export default class AuthService {
  constructor(userRepository) {
    if (!userRepository) {
      throw new AppError("User repository is required");
    }
    this.userRepository = userRepository;
  }

  formatUserForResponse(user) {
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    return userObj;
  }

  generateToken(user) {
    const { _id, email, username, role, client_id } = user;
    const payload = {
      userId: _id,
      email,
      username,
      role,
      clientId: client_id || null,
    };
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
    return token;
  }

  comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
  };

  onboardSuperAdmin = async (superAdminData) => {
    try {
      const users = await this.userRepository.findAll();
      if (users?.length > 0) {
        throw new AppError("Super admin onboarding is disabled");
      }

      const superAdmin = await this.userRepository.create(superAdminData);

      const token = this.generateToken(superAdmin);

      logger.info(`Super admin onboarded successfully: ${superAdmin.username}`);

      return {
        user: this.formatUserForResponse(superAdmin),
        token,
      };
    } catch (error) {
      logger.error(`Failed to onboard super admin: ${error.message}`);
      throw error;
    }
  };

  register = async (userData) => {
    try {
      const { email, username } = userData;

      let existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new AppError("Email already exists", 409);
      }

      existingUser = await this.userRepository.findByUsername(username);
      if (existingUser) {
        throw new AppError("Username already exists", 409);
      }

      const user = await this.userRepository.create(userData);
      const token = this.generateToken(user);

      logger.info(`User created successfully: ${user.username}`);
      return {
        user: this.formatUserForResponse(user),
        token,
      };
    } catch (error) {
      logger.error(`Failed to register user service: ${error.message}`);
      throw error;
    }
  };

  login = async (userData) => {
    try {
      const { username, password } = userData;

      let user = await this.userRepository.findByUsername(username);
      if (!user) {
        throw new AppError("Username not found", 404);
      }

      if (!user.isActive) {
        throw new AppError("User is not active", 403);
      }

      const isMatched = await this.comparePassword(password, user.password);

      if (!isMatched) {
        throw new AppError("Invalid Credentials", 401);
      }

      const token = this.generateToken(user);
      logger.info(`User logged in successfully: ${user.username}`);
      return {
        user: this.formatUserForResponse(user),
        token,
      };
    } catch (error) {
      logger.error(`Failed to login user service: ${error.message}`);
      throw error;
    }
  };

  getProfile = async (userId) => {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      logger.info(`User profile fetched successfully: ${user.username}`);
      return this.formatUserForResponse(user);
    } catch (error) {
      logger.error(`Failed to fetch user profile: ${error.message}`);
      throw error;
    }
  };

  checkSuperAdminPermissions = async (userId) => {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) throw new AppError("User not found with userId", 404);

      return user.role === APPLICATION_ROLES;
    } catch (error) {
      logger.error(`Failed to fetch user permission: ${error.message}`);
      throw error;
    }
  };
}
