import mongoose from 'mongoose';
import { ResponseHandler, ResponseError } from '../utils/wrappers/responseWrapper.util.js';
import logger from '../utils/logger.util.js';

class MongooseService {
  constructor(Model) {
    this.Model = Model;
  }

  async execute(operation) {
    try {
      return await operation();
    } catch (err) {
      // Duplicate key — return a friendly sm:10 instead of raw MongoDB message
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'value';
        ResponseHandler.error(10, 409, `A record with this ${field} already exists`);
      }
      if (
        err instanceof ResponseError ||
        err instanceof mongoose.Error.CastError ||
        err instanceof mongoose.Error.ValidationError ||
        err instanceof mongoose.Error ||
        err instanceof TypeError
      ) {
        throw err;
      }
      logger.error('MongooseService unexpected error', { message: err.message });
      ResponseHandler.error(2, 500, err.message);
    }
  }

  async create({ payload, options, validatePayload, _errorSm = 10, field }) {
    if (validatePayload) {
      ResponseHandler.error(21, 400, 'Validation failed before create', field);
    }
    return this.execute(() => this.Model.create(payload, options));
  }

  async bulkCreate({ payloadArray, options, validatePayload, _errorSm = 10, field }) {
    if (validatePayload) {
      ResponseHandler.error(21, 400, 'Validation failed before bulkCreate', field);
    }
    return this.execute(() => this.Model.insertMany(payloadArray, options));
  }

  async patch({ query, updateData, options, errorSm = 11, field }) {
    return this.execute(async () => {
      const doc = await this.Model.findOneAndUpdate(query, updateData, {
        new: true,
        runValidators: true,
        ...options,
      });
      if (!doc) ResponseHandler.error(errorSm, 404, 'Document not found', field);
      return doc;
    });
  }

  async updateById({ id, payload, options, validatePayload, errorSm = 30, field }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      ResponseHandler.error(24, 406, 'Invalid ID format', field);
    }
    if (validatePayload) {
      ResponseHandler.error(21, 400, 'Validation failed before updateById', field);
    }
    return this.execute(async () => {
      const doc = await this.Model.findByIdAndUpdate(id, payload, { new: true, ...options });
      if (!doc) ResponseHandler.error(errorSm, 404, 'Document not found', field);
      return doc;
    });
  }

  async bulkWrite({ operations, options, _errorSm = 11, _field }) {
    return this.execute(() => this.Model.bulkWrite(operations, options));
  }

  async findAll({
    filter = {},
    options = {},
    _validatePayload,
    populate,
    _errorSm = 22,
    _field,
    _errorHandler = true,
  }) {
    const { limit = 20, skip = 0, sort = { createdAt: -1 }, select } = options;
    return this.execute(async () => {
      let q = this.Model.find(filter);
      if (limit) q = q.limit(limit);
      if (skip) q = q.skip(skip);
      if (sort) q = q.sort(sort);
      if (select) q = q.select(select);
      if (populate) q = q.populate(populate);
      return q.lean();
    });
  }

  async findOne({
    filter = {},
    project,
    options,
    _validatePayload,
    populate,
    errorSm = 6,
    field,
    errorHandler = false,
  }) {
    return this.execute(async () => {
      let q = this.Model.findOne(filter, project, options);
      if (populate) q = q.populate(populate);
      const doc = await q;
      if (!doc && !errorHandler) ResponseHandler.error(errorSm, 404, 'Document not found', field);
      return doc;
    });
  }

  async findById({ id, filter, options, _validatePayload, populate, errorSm = 6, field }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      ResponseHandler.error(24, 406, 'Invalid ID format', field);
    }
    return this.execute(async () => {
      let q = this.Model.findById(id, filter, options);
      if (populate) q = q.populate(populate);
      const doc = await q;
      if (!doc) ResponseHandler.error(errorSm, 404, 'Document not found', field);
      return doc;
    });
  }

  async aggregate({ pipeline = [], _validatePayload, errorSm = 6, field, errorHandler = false }) {
    return this.execute(async () => {
      const results = await this.Model.aggregate(pipeline);
      if (!results.length && !errorHandler) {
        ResponseHandler.error(errorSm, 404, 'No results found', field);
      }
      return results;
    });
  }

  async count({ filter = {}, _errorSm = 6, _field }) {
    return this.execute(() => this.Model.countDocuments(filter));
  }

  async textSearch({
    searchString,
    filter = {},
    options = {},
    project,
    populate,
    _errorSm = 22,
    field,
    _errorHandler = true,
  }) {
    if (!searchString || !searchString.trim()) {
      ResponseHandler.error(21, 400, 'Search string is required', field);
    }
    const { limit = 20, skip = 0, sort } = options;
    return this.execute(async () => {
      let q = this.Model.find(
        { ...filter, $text: { $search: searchString } },
        { score: { $meta: 'textScore' }, ...project }
      )
        .sort(sort || { score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);
      if (populate) q = q.populate(populate);
      return q.lean();
    });
  }

  async delete({ filter, options, _errorSm = 27, _field, errorHandler = false }) {
    return this.execute(async () => {
      const doc = await this.Model.findOneAndDelete(filter, options);
      if (!doc && !errorHandler) ResponseHandler.error(27, 404, 'Document not found');
      return doc;
    });
  }

  async deleteById({ id, errorSm = 27, field }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      ResponseHandler.error(24, 406, 'Invalid ID format', field);
    }
    return this.execute(async () => {
      const doc = await this.Model.findByIdAndDelete(id);
      if (!doc) ResponseHandler.error(errorSm, 404, 'Document not found', field);
      return doc;
    });
  }
}

export default MongooseService;
