export const populateConfig = {
  ImmigrationCase: [
    { path: 'petitionerId',  select: 'legalName email' },
    { path: 'beneficiaryId', select: 'firstName lastName email currentWorkStatus' },
    { path: 'attorneyId',    select: 'firstName lastName email firmName' },
  ],
  CaseForm: [
    { path: 'caseId', select: 'caseNumber visaType status beneficiaryId' },
  ],
  I9Record: [
    { path: 'beneficiaryId', select: 'firstName lastName email' },
  ],
  CaseDocument: [
    { path: 'caseId', select: 'caseNumber visaType' },
  ],
  CaseTask: [
    { path: 'caseId', select: 'caseNumber visaType status' },
  ],
  CaseNote: [
    { path: 'caseId', select: 'caseNumber' },
  ],
  CaseTimeline: [
    { path: 'caseId', select: 'caseNumber visaType status' },
  ],
  SiteVisit: [
    { path: 'petitionerId', select: 'legalName email' },
  ],
  Packet: [
    { path: 'caseId',        select: 'caseNumber visaType status' },
    { path: 'beneficiaryId', select: 'firstName lastName' },
    { path: 'petitionerId',  select: 'legalName' },
  ],
  Beneficiary: undefined,
  Petitioner:  undefined,
  Attorney:    undefined,
  VisaType:    undefined,
  CaseStage:   undefined,
  DocType:     undefined,
};
