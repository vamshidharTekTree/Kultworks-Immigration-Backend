export const populateConfig = {
  ImmigrationCase: [
    { path: 'petitionerId',  select: 'companyName email petitionerId' },
    { path: 'beneficiaryId', select: 'firstName lastName email beneficiaryId currentStatus' },
    { path: 'attorneyId',    select: 'firstName lastName email firmName' },
  ],
  CaseForm: [
    { path: 'caseId', select: 'caseNumber visaType status' },
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
  Beneficiary: undefined,
  Petitioner:  undefined,
  Attorney:    undefined,
  VisaType:    undefined,
  CaseStage:   undefined,
  DocType:     undefined,
};
