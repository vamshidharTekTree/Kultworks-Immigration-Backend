const baseFieldsPlugin = (schema) => {
  schema.add({
    orgId:      { type: String, required: true, index: true },
    createdBy:  { type: String, default: null },
    updatedBy:  { type: String, default: null },
    isDeleted:  { type: Boolean, default: false, index: true },
    deletedAt:  { type: Date, default: null },
  });

  // Pre-find hooks: exclude soft-deleted docs unless caller opts in
  const excludeDeleted = function () {
    if (!this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  };

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);

  // Query helper to bypass the soft-delete filter
  schema.query.includeDeleted = function () {
    return this.setOptions({ includeDeleted: true });
  };
};

export default baseFieldsPlugin;
