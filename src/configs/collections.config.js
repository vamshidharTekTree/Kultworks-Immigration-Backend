export const collectionConfig = {
  Beneficiary: {
    fields: (payload) => ({
      // Identity
      petitionerId:  payload.petitionerId  || undefined,
      // Name
      firstName:     payload.firstName,
      middleName:    payload.middleName    || undefined,
      lastName:      payload.lastName,
      // Contact
      email:         payload.email,
      phone:         payload.phone         || undefined,
      // Personal
      dateOfBirth:      payload.dateOfBirth      || undefined,
      gender:           payload.gender            || undefined,
      nationality:      payload.nationality       || undefined,
      countryOfBirth:   payload.countryOfBirth    || undefined,
      cityOfBirth:      payload.cityOfBirth       || undefined,
      maritalStatus:    payload.maritalStatus      || undefined,
      // Work & tax
      currentWorkStatus: payload.currentWorkStatus || undefined,
      taxTerm:           payload.taxTerm           || undefined,
      dataSource:        payload.dataSource        || 'Manual',
      // Addresses
      address:        payload.address        || undefined,
      mailingAddress: payload.mailingAddress || undefined,
      // Passport
      passportNumber:  payload.passportNumber  || undefined,
      passportCountry: payload.passportCountry || undefined,
      passportExpiry:  payload.passportExpiry  || undefined,
      // I-94
      i94Number:           payload.i94Number           || undefined,
      i94AdmitUntil:       payload.i94AdmitUntil       || undefined,
      i94ClassOfAdmission: payload.i94ClassOfAdmission || undefined,
      // US government numbers (last 4 of SSN only)
      ssnMasked: payload.ssnMasked || undefined,
      aNumber:   payload.aNumber   || undefined,
      // Arrays
      education: Array.isArray(payload.education) ? payload.education : undefined,
      // Legacy fields
      priorityDate: payload.priorityDate || undefined,
      notes:        payload.notes        || undefined,
    }),
    validate: (payload) => !payload.firstName || !payload.lastName || !payload.email,
    response: (doc) => doc,
  },

  Petitioner: {
    fields: (payload) => ({
      // Name — accept legalName (frontend) or companyName (legacy)
      legalName:  payload.legalName || payload.companyName,
      tradeName:  payload.tradeName  || undefined,
      // Type & status
      type:   payload.type   || undefined,
      status: payload.status || 'Active',
      // Identifiers
      ein:  payload.ein  || undefined,
      fein: payload.fein || undefined,
      // Contact
      phone:   payload.phone   || undefined,
      email:   payload.email   || undefined,
      website: payload.website || undefined,
      // Flat address fields (form sends these directly)
      street:  payload.street  || undefined,
      city:    payload.city    || undefined,
      state:   payload.state   || undefined,
      zip:     payload.zip     || undefined,
      country: payload.country || undefined,
      // Classification
      industry:        payload.industry        || undefined,
      naicsCode:       payload.naicsCode       || undefined,
      employeeCount:   payload.employeeCount   || undefined,
      yearEstablished: payload.yearEstablished || undefined,
      description:     payload.description     || undefined,
      // Contacts
      primaryContact: payload.primaryContact || undefined,
      signatoryName:  payload.signatoryName  || undefined,
      signatoryTitle: payload.signatoryTitle || undefined,
      attorneyId:     payload.attorneyId     || undefined,
      notes:          payload.notes          || undefined,
    }),
    validate: (payload) => !payload.legalName && !payload.companyName,
    response: (doc) => doc,
  },

  ImmigrationCase: {
    fields: (payload) => ({
      visaType:  payload.visaType,
      // caseType: petition sub-types + proxy types for lca / green_card_group / cap_registration
      caseType:  ['new', 'extension', 'transfer', 'amendment', 'renewal', 'lca', 'green_card_group', 'cap_registration'].includes(payload.caseType)
        ? payload.caseType
        : undefined,
      status:        payload.status,
      stage:         payload.stage,
      petitionerId:  payload.petitionerId,
      beneficiaryId: payload.beneficiaryId,
      attorneyId:    payload.attorneyId,
      priority:      payload.priority,
      priorityDate:  payload.priorityDate,
      filingDate:    payload.filingDate,
      receiptNumber: payload.receiptNumber,
      approvalDate:  payload.approvalDate,
      expiryDate:    payload.expiryDate,
      workLocation:  payload.workLocation,
      jobTitle:      payload.jobTitle,
      socCode:       payload.socCode,
      wageLevel:     payload.wageLevel,
      lcaNumber:     payload.lcaNumber,
      notes:         payload.notes,
      tags:          payload.tags,
      assignedTo:    payload.assignedTo,
      metadata:      payload.metadata,
    }),
    // LCA has no beneficiaryId; cap_registration always sets visaType='H-1B'; other types require all three
    validate: (payload) => !payload.petitionerId || (payload.caseType !== 'lca' && (!payload.visaType || !payload.beneficiaryId)),
    filterFields: ['status', 'visaType', 'caseType', 'petitionerId', 'beneficiaryId', 'stage', 'assignedTo'],
    rangeFilterFields: { expiryBefore: 'expiryDate', filingDateBefore: 'filingDate' },
    response: (doc) => doc,
  },

  CaseForm: {
    fields: (payload) => ({
      caseId:   payload.caseId,
      formType: payload.formType,
      formData: payload.formData,
      status:   payload.status,
      version:  payload.version,
      notes:    payload.notes,
    }),
    // Templates, settings docs, and questionnaire responses are not case-specific — all others require caseId
    validate: (payload) => !payload.formType || (
      !['questionnaire_template', 'workflow_template', 'questionnaire_response', 'letter_template', 'alert_rule', 'role_matrix'].includes(payload.formType)
      && !payload.caseId
    ),
    // Safe query-param filters the GET list endpoint may apply
    filterFields: ['formType', 'caseId', 'status'],
    response: (doc) => ({
      id:        doc._id,
      formType:  doc.formType,
      formData:  doc.formData,
      status:    doc.status,
      version:   doc.version,
      // caseId may be populated by populateConfig — always return the string _id
      caseId:    doc.caseId?._id?.toString() ?? doc.caseId?.toString() ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }),
  },

  CaseDocument: {
    fields: (payload) => ({
      caseId:       payload.caseId,
      docType:      payload.docType,
      fileName:     payload.fileName,
      originalName: payload.originalName,
      mimeType:     payload.mimeType,
      size:         payload.size,
      storagePath:  payload.storagePath,
      storageUrl:   payload.storageUrl,
      uploadedBy:   payload.uploadedBy,
      uploaderType: payload.uploaderType,
      status:       payload.status,
      expiryDate:   payload.expiryDate,
      notes:        payload.notes,
    }),
    validate: (payload) => !payload.caseId || !payload.docType,
    filterFields:      ['caseId', 'status', 'docType'],
    rangeFilterFields: { expiryBefore: 'expiryDate' },
    response: (doc) => doc,
  },

  CaseTask: {
    fields: (payload) => ({
      caseId:      payload.caseId,
      title:       payload.title,
      description: payload.description,
      status:      payload.status,
      priority:    payload.priority,
      dueDate:     payload.dueDate,
      assignedTo:  payload.assignedTo,
      completedBy: payload.completedBy,
      completedAt: payload.completedAt,
      category:    payload.category,
    }),
    validate:     (payload) => !payload.caseId || !payload.title,
    filterFields: ['caseId', 'status', 'priority', 'assignedTo', 'category'],
    response:     (doc) => doc,
  },

  CaseNote: {
    fields: (payload) => ({
      caseId:      payload.caseId,
      content:     payload.content,
      noteType:    payload.noteType,
      authorId:    payload.authorId,
      authorName:  payload.authorName,
      isPrivate:   payload.isPrivate,
      attachments: payload.attachments,
    }),
    validate: (payload) => !payload.caseId || !payload.content,
    response: (doc) => doc,
  },

  CaseTimeline: {
    fields: (payload) => ({
      caseId:        payload.caseId,
      eventType:     payload.eventType,
      fromStatus:    payload.fromStatus,
      toStatus:      payload.toStatus,
      description:   payload.description,
      performedBy:   payload.performedBy,
      performerName: payload.performerName,
      performerType: payload.performerType,
      metadata:      payload.metadata,
    }),
    validate: (payload) => !payload.caseId || !payload.eventType || !payload.description,
    response: (doc) => doc,
  },

  Attorney: {
    fields: (payload) => ({
      firstName:      payload.firstName,
      lastName:       payload.lastName,
      email:          payload.email,
      phone:          payload.phone,
      barNumber:      payload.barNumber,
      firmName:       payload.firmName,
      firmAddress:    payload.firmAddress,
      licenseState:   payload.licenseState,
      specialization: payload.specialization,
      status:         payload.status,
      notes:          payload.notes,
    }),
    validate: (payload) => !payload.firstName || !payload.email,
    response: (doc) => ({
      id:             doc._id,
      name:           `${doc.firstName} ${doc.lastName}`.trim(),
      firstName:      doc.firstName,
      lastName:       doc.lastName,
      email:          doc.email,
      phone:          doc.phone,
      barNumber:      doc.barNumber,
      firmName:       doc.firmName,
      firmAddress:    doc.firmAddress,
      licenseState:   doc.licenseState,
      specialization: doc.specialization,
      status:         doc.status,
      notes:          doc.notes,
    }),
  },

  VisaType: {
    fields: (payload) => ({
      code:              payload.code,
      name:              payload.name,
      category:          payload.category,
      description:       payload.description,
      maxDuration:       payload.maxDuration,
      requiresLca:       payload.requiresLca,
      requiresLaborTest: payload.requiresLaborTest,
      petitionForms:     payload.petitionForms,
      isActive:          payload.isActive,
      displayOrder:      payload.displayOrder,
    }),
    validate: (payload) => !payload.code || !payload.name,
    response: (doc) => ({
      id:       doc._id,
      code:     doc.code,
      name:     doc.name,
      category: doc.category,
    }),
  },

  CaseStage: {
    fields: (payload) => ({
      code:        payload.code,
      name:        payload.name,
      description: payload.description,
      visaTypes:   payload.visaTypes,
      order:       payload.order,
      isActive:    payload.isActive,
      nextStages:  payload.nextStages,
    }),
    validate: (payload) => !payload.code || !payload.name,
    response: (doc) => ({
      id:    doc._id,
      code:  doc.code,
      name:  doc.name,
      order: doc.order,
    }),
  },

  Notification: {
    fields: (payload) => ({
      refId: payload.refId,
      read:  payload.read ?? true,
    }),
    validate:     (payload) => !payload.refId,
    filterFields: ['refId', 'read'],
    response:     (doc) => ({ id: doc._id, refId: doc.refId, read: doc.read, createdAt: doc.createdAt }),
  },

  DocType: {
    fields: (payload) => ({
      code:            payload.code,
      name:            payload.name,
      description:     payload.description,
      visaTypes:       payload.visaTypes,
      isRequired:      payload.isRequired,
      isActive:        payload.isActive,
      expiryTracked:   payload.expiryTracked,
      acceptedFormats: payload.acceptedFormats,
      maxSizeMb:       payload.maxSizeMb,
    }),
    validate: (payload) => !payload.code || !payload.name,
    response: (doc) => ({
      id:         doc._id,
      code:       doc.code,
      name:       doc.name,
      isRequired: doc.isRequired,
    }),
  },
};
