import BaseClientRepository from "./BaseClientRepository.js";
import ClientModel from "../../../shared/models/Client.js";
import logger from "../../../shared/utils/logger.js";
class MongoClientRepository extends BaseClientRepository {
  constructor() {
    super(ClientModel);
  }

  /**
   * Creates a new client in the database
   * @param {Object} clientData - The data for the new client
   * @returns {Promise<Object>} - A promise resolving to the created client
   */
  create = async (clientData) => {
    try {
      const client = new this.model(clientData);
      await client.save();

      logger.info(`Client created with ID: ${client._id}`);
      return client;
    } catch (err) {
      logger.error(`Error creating client in database: ${err.message}`);
      throw err;
    }
  };

  /**
   * Finds a client by their ID
   * @param {String} id - The ID of the client to find
   * @returns {Promise<Object|null>} - A promise resolving to the found client or null if not found
   */
  findById = async (id) => {
    try {
      const client = await this.model.findById(id);
      if (!client) {
        logger.error(`Client with ID: ${id} not found`);
        return null;
      }
      logger.info(`Client found with ID: ${id}`);
      return client;
    } catch (err) {
      logger.error(`Error finding client by ID in database: ${err.message}`);
      throw err;
    }
  };

  /**
   * Finds a client by their slug
   * @param {String} slug - The slug of the client to find
   * @returns {Promise<Object|null>} - A promise resolving to the found client or null if not found
   */

  findBySlug = async (slug) => {
    try {
      const client = await this.model.findOne({ slug });
      if (!client) {
        logger.error(`Client with slug: ${slug} not found`);
        return null;
      }
      logger.info(`Client found with slug: ${slug}`);
      return client;
    } catch (err) {
      logger.error(`Error finding client by slug in database: ${err.message}`);
      throw err;
    }
  };

  /**
   * Finds all clients matching the given filter and options
   * @param {Object} filter - The filter criteria for finding clients
   * @param {Object} options - The options for the query
   * @returns {Promise<Array>} - A promise resolving to the array of found clients
   */

  findAll = async (filter = {}, options = {}) => {
    try {
      const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;
      const clients = await this.model
        .find(filter)
        .limit(limit)
        .skip(skip)
        .sort(sort)
        .select("-__v");
      logger.info(`Found ${clients.length} clients`);
      return clients;
    } catch (err) {
      logger.error(`Error finding clients in database: ${err.message}`);
      throw err;
    }
  };

  count = async (filter = {}) => {
    try {
      const count = await this.model.countDocuments(filter);
      logger.info(`Counted ${count} clients`);
      return count;
    } catch (err) {
      logger.error(`Error counting clients in database: ${err.message}`);
      throw err;
    }
  };
}


export default MongoClientRepository;