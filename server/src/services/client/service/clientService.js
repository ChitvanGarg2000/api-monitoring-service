import logger from "../../../shared/config/logger.js";
import {
  APPLICATION_ROLES,
  isValidClientRole,
} from "../../../shared/constants/role.js";
import AppError from "../../../shared/utils/AppError.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export default class ClientService {
  constructor(clientRepository, apiKeyRepository, userRepository) {
    if (!clientRepository || !apiKeyRepository || !userRepository)
      throw new Error(
        "clientRepository, apikeyRepository and userRepository all three are required",
      );
    this.clientRepository = clientRepository;
    this.apiKeyRepository = apiKeyRepository;
    this.userRepository = userRepository;
  }

  formatClientForResponse(client) {
    const clientObj = client.toObject ? client.toObject() : { ...client };
    delete clientObj.password;
    return clientObj;
  }

  /**
   *
   * @param {String} name
   * @returns {String} slug
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  /**
   * Generate a high-entropy, URL-safe API key and an associated keyId.
   * Ensures uniqueness by checking the `apiKeyRepository.findByKeyValue`.
   * @param {Object} [options]
   * @param {number} [options.byteLength=32] - number of random bytes to generate
   * @param {number} [options.maxRetries=5] - how many attempts to make to avoid collision
   * @returns {Promise<{keyId: string, keyValue: string}>}
   */
  async generateApiKey(options = {}) {
    const { byteLength = 32, maxRetries = 5 } = options;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Create URL-safe base64 value (replace +/ and trim =)
      const raw = crypto
        .randomBytes(byteLength)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const keyId = uuidv4();
      const keyValue = raw;

      // Check repository for collisions (active keys only)
      const existing = await this.apiKeyRepository.findByKeyValue(
        keyValue,
        false,
      );
      if (!existing) {
        return { keyId, keyValue };
      }
      // otherwise loop and try again
    }

    throw new AppError(
      "Unable to generate unique API key after multiple attempts",
      500,
    );
  }

  createClient = async (clientData, adminUser) => {
    try {
      const { name, email, description, website } = clientData;

      const slug = this.generateSlug(name);

      const isExistiengClient = this.clientRepository.findBySlug(slug);

      if (isExistiengClient) {
        throw new AppError(`client with slug ${slug} already exist`, 409);
      }

      const client = await this.clientRepository.create({
        name,
        slug,
        description,
        website,
        createdBy: adminUser?.userId,
      });
      logger.info(`Client created successfully: ${client._id}`);
      return this.formatClientForResponse(client);
    } catch (err) {
      logger.error("Error is creating client", err);
      throw err;
    }
  };

  canUserAccessClient = (adminUser, clientId) => {
    if (adminUser.role === APPLICATION_ROLES.SUPER_ADMIN) {
      return true;
    }

    return (
      adminUser.clientId &&
      adminUser.clientId.toString() === clientId.toString()
    );
  };

  createClientUser = async (clientId, userData, adminUser) => {
    try {
      const client = this.clientRepository.findById(clientId);

      if (!client) throw new AppError("client not found", 404);

      if (!this.canUserAccessClient(adminUser, clientId)) {
        throw new AppError("Access denied", 403);
      }

      const {
        username,
        password,
        role = APPLICATION_ROLES.CLIENT_VIEWER,
      } = userData;

      if (!isValidClientRole(role)) {
        throw new AppError("Invalid user role", 400);
      }

      let permissions = {
        canCreateApiKeys: false,
        canManageUsers: false,
        canViewAnalytics: true,
        canExportData: false,
      };

      if (role === APPLICATION_ROLES.CLIENT_ADMIN) {
        permissions = {
          canCreateApiKeys: true,
          canManageUsers: true,
          canViewAnalytics: true,
          canExportData: true,
        };
      }

      const user = await this.userRepository.create({
        username,
        email,
        password,
        role,
        clientId,
        permissions,
      });

      logger.info("Client user created", {
        client: client.clientId,
        user: user.user._id,
        role,
      });
      return this.formatClientForResponse(user);
    } catch (error) {
      logger.error("Error creating client user", error.message);
      throw error;
    }
  };

  createApiKey = async (clientId, keyData, user) => {
    try {
      const client = await this.clientRepository.findById(clientId);
      if (!client) throw new AppError("client not found", 404);

      if (!this.canUserAccessClient(user, clientId)) {
        throw new AppError("Access denied", 403);
      }

      const { role } = user;

      if (
        !(
          role === APPLICATION_ROLES.CLIENT_ADMIN ||
          role === APPLICATION_ROLES.SUPER_ADMIN
        )
      ) {
        throw new AppError("Operation not allowed", 403);
      }

      const { name, description = "", environment = "production" } = keyData;

      const { keyId, keyValue } = await this.generateApiKey();

      const apiKey = this.apiKeyRepository.create({
        keyId,
        keyValue: `am-${keyValue}`,
        name,
        description,
        environment,
        createdBy: adminUser.userId,
      });

      logger.info("Api key created successfully in service", apiKey);

      return apiKey;
    } catch (error) {
      logger.error("Error creating api key", error.message);
      throw error;
    }
  };

  getApiKeys = async (clientId) => {
    try {
      const apiKeys = this.apiKeyRepository.findByClientId(clientId);

      if (!apiKeys || apiKeys.length === 0) {
        throw new AppError("client does not have any api keys", 404);
      }

      const result = apiKeys.map((apiKey) => {
        const api = apiKey.toObject ? apiKey.toObject() : apiKey;
        delete api.keyValue;
        return api;
      });

      return result;
    } catch {
      logger.error("Error gettting api keys", error.message);
      throw error;
    }
  };
}
