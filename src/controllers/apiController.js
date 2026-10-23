import { services }         from '../utils/dbRegistry.util.js';
import { collectionConfig } from '../configs/collections.config.js';
import { populateConfig }   from '../configs/populates.config.js';
import { AsyncWrapper, ResponseHandler } from '../utils/wrappers/responseWrapper.util.js';

function getService(collection) {
  const entry = services[collection];
  if (!entry) ResponseHandler.error(6, 404, `Unknown collection: ${collection}`);
  return entry.service;
}

export const handleGet = AsyncWrapper(async (req, res) => {
  const { collection, id } = req.params;
  const service = getService(collection);
  const orgId = req.user.organizationId;

  // Single-item fetch when an id is in the path
  if (id) {
    const doc = await service.findById({
      id,
      populate: populateConfig[collection],
    });
    return res.json(ResponseHandler.success(1, doc));
  }

  const page   = Math.max(1, Number(req.query.page)  || 1);
  const limit  = Math.min(200, Number(req.query.limit) || 20);
  const skip   = (page - 1) * limit;
  const search = req.query.search;

  const baseFilter = { orgId, isDeleted: false };

  let docs;
  if (search) {
    docs = await service.textSearch({
      searchString: search,
      filter:  baseFilter,
      options: { limit, skip },
      populate: populateConfig[collection],
    });
  } else {
    docs = await service.findAll({
      filter:  baseFilter,
      options: { limit, skip, sort: { createdAt: -1 } },
      populate: populateConfig[collection],
    });
  }

  res.json(ResponseHandler.success(1, docs));
});

export const handlePost = AsyncWrapper(async (req, res) => {
  const { collection } = req.params;
  const service = getService(collection);
  const config  = collectionConfig[collection] ?? {};
  const payload = config.fields ? config.fields(req.body) : req.body;

  if (config.validate?.(payload)) {
    ResponseHandler.error(21, 400, 'Validation failed — required fields missing');
  }

  const doc = await service.create({
    payload: {
      ...payload,
      orgId:     req.user.organizationId,
      createdBy: req.user.userId,
    },
  });

  res.json(ResponseHandler.success(1, doc));
});

export const handlePatch = AsyncWrapper(async (req, res) => {
  const { collection, id } = req.params;
  const service = getService(collection);
  const config  = collectionConfig[collection] ?? {};
  const payload = config.fields ? config.fields(req.body) : req.body;

  const doc = await service.patch({
    query:      { _id: id, orgId: req.user.organizationId, isDeleted: false },
    updateData: { ...payload, updatedBy: req.user.userId },
  });

  res.json(ResponseHandler.success(1, doc));
});

export const handleDelete = AsyncWrapper(async (req, res) => {
  const { collection, id } = req.params;
  const service = getService(collection);

  const doc = await service.patch({
    query:      { _id: id, orgId: req.user.organizationId, isDeleted: false },
    updateData: { isDeleted: true, deletedAt: new Date(), updatedBy: req.user.userId },
  });

  res.json(ResponseHandler.success(1, doc));
});
