import MongooseService from '../services/mongoose.service.js';

import Beneficiary     from '../models/Beneficiary.model.js';
import Petitioner      from '../models/Petitioner.model.js';
import ImmigrationCase from '../models/ImmigrationCase.model.js';
import CaseForm        from '../models/CaseForm.model.js';
import CaseDocument    from '../models/CaseDocument.model.js';
import CaseTask        from '../models/CaseTask.model.js';
import CaseNote        from '../models/CaseNote.model.js';
import CaseTimeline    from '../models/CaseTimeline.model.js';
import Attorney        from '../models/Attorney.model.js';
import VisaType        from '../models/VisaType.model.js';
import CaseStage       from '../models/CaseStage.model.js';
import DocType         from '../models/DocType.model.js';
import Notification    from '../models/Notification.model.js';
import Invoice        from '../models/Invoice.model.js';

const BeneficiaryService     = new MongooseService(Beneficiary);
const PetitionerService      = new MongooseService(Petitioner);
const ImmigrationCaseService = new MongooseService(ImmigrationCase);
const CaseFormService        = new MongooseService(CaseForm);
const CaseDocumentService    = new MongooseService(CaseDocument);
const CaseTaskService        = new MongooseService(CaseTask);
const CaseNoteService        = new MongooseService(CaseNote);
const CaseTimelineService    = new MongooseService(CaseTimeline);
const AttorneyService        = new MongooseService(Attorney);
const VisaTypeService        = new MongooseService(VisaType);
const CaseStageService       = new MongooseService(CaseStage);
const DocTypeService         = new MongooseService(DocType);
const NotificationService    = new MongooseService(Notification);
const InvoiceService         = new MongooseService(Invoice);

export const services = {
  Beneficiary:     { service: BeneficiaryService,     cache: undefined },
  Petitioner:      { service: PetitionerService,      cache: undefined },
  ImmigrationCase: { service: ImmigrationCaseService, cache: undefined },
  CaseForm:        { service: CaseFormService,        cache: undefined },
  CaseDocument:    { service: CaseDocumentService,    cache: undefined },
  CaseTask:        { service: CaseTaskService,        cache: undefined },
  CaseNote:        { service: CaseNoteService,        cache: undefined },
  CaseTimeline:    { service: CaseTimelineService,    cache: undefined },
  Attorney:        { service: AttorneyService,        cache: undefined },
  VisaType:        { service: VisaTypeService,        cache: undefined },
  CaseStage:       { service: CaseStageService,       cache: undefined },
  DocType:         { service: DocTypeService,         cache: undefined },
  Notification:    { service: NotificationService,    cache: undefined },
  Invoice:         { service: InvoiceService,         cache: undefined },
};
