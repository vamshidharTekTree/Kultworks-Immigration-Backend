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

  // Single-item fetch when an id is in the path (respects soft-delete)
  if (id) {
    const doc = await service.findOne({
      filter: { _id: id, orgId, isDeleted: { $ne: true } },
      populate: populateConfig[collection],
    });
    return res.json(ResponseHandler.success(1, doc));
  }

  const page   = Math.max(1, Number(req.query.page)  || 1);
  const limit  = Math.min(200, Number(req.query.limit) || 20);
  const skip   = (page - 1) * limit;
  const search = req.query.search;

  const config = collectionConfig[collection] ?? {};
  const baseFilter = { orgId, isDeleted: { $ne: true } };
  // Apply collection-declared safe filter fields from query params
  if (config.filterFields) {
    for (const field of config.filterFields) {
      const v    = req.query[field];
      const vNin = req.query[`${field}_nin`];
      if (v    !== undefined && v    !== '') baseFilter[field] = v;
      if (vNin !== undefined && vNin !== '') baseFilter[field] = { $nin: vNin.split(',') };
    }
  }
  if (config.rangeFilterFields) {
    for (const [param, field] of Object.entries(config.rangeFilterFields)) {
      const v = req.query[param];
      if (v !== undefined && v !== '') baseFilter[field] = { $lte: new Date(v) };
    }
  }

  let docs;
  let total = 0;
  if (search) {
    if (config.searchFields?.length) {
      // Regex-based partial search across declared fields
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const searchFilter = { ...baseFilter, $or: config.searchFields.map((f) => ({ [f]: re })) };
      let countResult;
      [docs, countResult] = await Promise.all([
        service.findAll({
          filter:  searchFilter,
          options: { limit, skip, sort: { createdAt: -1 } },
          populate: populateConfig[collection],
        }),
        service.aggregate({
          pipeline: [{ $match: searchFilter }, { $count: 'n' }],
          errorHandler: true,
        }),
      ]);
      total = countResult[0]?.n ?? docs.length;
    } else {
      docs = await service.textSearch({
        searchString: search,
        filter:  baseFilter,
        options: { limit, skip },
        populate: populateConfig[collection],
      });
      total = docs.length;
    }
  } else {
    let countResult;
    [docs, countResult] = await Promise.all([
      service.findAll({
        filter:  baseFilter,
        options: { limit, skip, sort: { createdAt: -1 } },
        populate: populateConfig[collection],
      }),
      service.aggregate({
        pipeline: [{ $match: baseFilter }, { $count: 'n' }],
        errorHandler: true,
      }),
    ]);
    total = countResult[0]?.n ?? 0;
  }

  console.log(`[apiController] ${collection} page=${page} limit=${limit} docs=${docs.length} total=${total} filter=${JSON.stringify(baseFilter)}`);
  res.json({ ...ResponseHandler.success(1, docs), total });
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
    query:      { _id: id, orgId: req.user.organizationId },
    updateData: { $set: { ...payload, updatedBy: req.user.userId } },
  });

  res.json(ResponseHandler.success(1, doc));
});

export const handleDelete = AsyncWrapper(async (req, res) => {
  const { collection, id } = req.params;
  const service = getService(collection);

  const doc = await service.patch({
    query:      { _id: id, orgId: req.user.organizationId },
    updateData: { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: req.user.userId } },
  });

  res.json(ResponseHandler.success(1, doc));
});
