export type GlossaryEntry = {
  slug: string;
  title: string;
  relatedHref: string;
  relatedLabel: string;
  body: string;
};

export const glossaryEntries: GlossaryEntry[] = [
  {
    slug: "brsr",
    title: "BRSR",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "Business Responsibility and Sustainability Reporting (BRSR) is SEBI’s format for listed companies in India to disclose environmental, social and governance information. It replaced the earlier Business Responsibility Report (BRR) and is organised around the National Guidelines on Responsible Business Conduct (NGRBC). For EHS teams, BRSR is not a separate ‘sustainability app’: several principles draw on the same injury, training, contractor and environmental data already sitting in operational systems. EHS360 treats BRSR as a reporting overlay on tenant EHS records where those records exist — not as a claim that every SEBI circular is auto-filed. Always confirm current SEBI applicability (including BRSR Core and assurance) with your company secretary and statutory auditor.",
  },
  {
    slug: "brsr-core",
    title: "BRSR Core",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "BRSR Core is the subset of BRSR indicators that SEBI has prioritised for reasonable assurance for specified listed entities. It is narrower than the full BRSR workbook and is meant to be more comparable across companies. Typical Core themes include greenhouse gases, water, waste, and workforce safety metrics — which is why an EHS system of record matters. EHS360 can hold the operational inputs (incidents, hours, training) that sustainability teams later map into Core line items; it does not replace the assurance provider. Applicability depends on listing status and SEBI’s current market-cap thresholds, which change by circular. Use the public checker at /resources/brsr-applicability for orientation, and treat this glossary as not legal advice.",
  },
  {
    slug: "csr",
    title: "CSR",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "Corporate Social Responsibility (CSR) in India is a Companies Act, 2013 obligation for companies that meet specified net worth, turnover or net profit tests. It is about eligible spend and Schedule VII activities — not the same thing as ESG disclosure or BRSR. Confusing CSR with EHS software is a common buyer mistake: CSR is a finance/secretarial programme; EHS is operational control of harm. EHS360 does not pretend to be a CSR accounting product. We mention CSR here because procurement teams often search ‘ESG vs CSR’ and need a clean split: CSR spend versus workplace safety and environmental operating controls that later feed ESG metrics.",
  },
  {
    slug: "epr",
    title: "EPR",
    relatedHref: "/product/compliance-tracking",
    relatedLabel: "Compliance tracking",
    body: "Extended Producer Responsibility (EPR) in India assigns producers, importers and brand owners obligations for post-consumer waste streams such as plastic packaging, e-waste, batteries and related categories under Central Pollution Control Board frameworks. Registration, returns and target fulfilment are statutory processes — not a module name we invent. EHS360’s compliance profile can record whether those waste streams apply to an organisation so obligation tracking stays next to EHS data. It does not file CPCB returns for you. If your question is ‘what is EPR registration’, start with the official CPCB portal for the relevant waste stream, then use EHS360 to keep the internal evidence and task cadence visible to EHS and sustainability owners.",
  },
  {
    slug: "cbam",
    title: "CBAM",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "The EU Carbon Border Adjustment Mechanism (CBAM) prices embedded emissions on certain goods imported into the EU (including, in its design, steel, aluminium, cement, fertilisers, electricity and hydrogen, with a transitional reporting phase). For Indian exporters in those sectors it is a customer and customs data problem as much as a climate one: you need defensible activity data, not a marketing GHG number. EHS360 can store organisation-level flags such as EU export exposure in the compliance profile and keep related EHS/environment records in the same tenant. It is not a CBAM filing engine and does not calculate official embedded-emissions reports. Use it to stop that work living in a side spreadsheet disconnected from incidents and permits.",
  },
  {
    slug: "ccts",
    title: "CCTS",
    relatedHref: "/product/compliance-tracking",
    relatedLabel: "Compliance tracking",
    body: "India’s Carbon Credit Trading Scheme (CCTS) is the national carbon market framework notified under the Energy Conservation Act pathway. Obligated sectors and compliance cycles are defined by government notification, not by software vendors. EHS360 records whether an organisation considers itself in a CCTS-relevant sector inside the compliance profile so related tasks can sit with other statutory work. We do not sell carbon credits, issue certificates, or claim exchange connectivity. If you are scoping ‘do we even fall in’, that is a legal/energy-audit question first; the product’s job is to keep the internal flag and evidence trail with the rest of EHS and ESG operations.",
  },
  {
    slug: "trir",
    title: "TRIR",
    relatedHref: "/product/incident-management",
    relatedLabel: "Incident management",
    body: "Total Recordable Incident Rate (TRIR) is a lagging safety indicator: typically (recordable incidents × 200,000) / hours worked, using OSHA-style recordability concepts even when the operation is in India. It is useful for trend and contractor comparison; it is a poor substitute for leading controls like LMRA completion or overdue CAPA. EHS360 captures incidents and can support rate discussions when hours are maintained — it will not invent a TRIR for a marketing page. Calculate TRIR with your own hours definition (employees vs contractors) and keep it consistent year to year. Pair it with LTIFR and with leading indicators so leadership does not manage only the lagging number.",
  },
  {
    slug: "ltifr",
    title: "LTIFR",
    relatedHref: "/product/incident-management",
    relatedLabel: "Incident management",
    body: "Lost Time Injury Frequency Rate (LTIFR) counts injuries that result in lost workdays, usually (lost-time injuries × 1,000,000) / hours worked — definitions vary by company standard. It is stricter than TRIR and easier to ‘manage’ by classification games, which is why investigation quality and recordability rules matter. EHS360 stores the incident record, severity and investigation path; your procedure still decides what counts as lost time. Use LTIFR beside near-miss and hazard volume so a falling LTIFR is not just under-reporting. This glossary will not prescribe a single formula as law; publish your definition in the organisation’s EHS manual and keep the software aligned to that definition.",
  },
  {
    slug: "jsa",
    title: "JSA",
    relatedHref: "/product/risk-assessment-jsa",
    relatedLabel: "Risk assessment & JSA",
    body: "A Job Safety Analysis (JSA) breaks a task into steps, hazards and controls before the work starts. In Indian EPC and plant practice it often sits beside a Job Hazard Analysis (JHA) and a last-minute risk assessment (LMRA) at the workface. Paper JSAs that never meet the permit or the crew are theatre. EHS360’s risk and JSA paths are meant to connect assessment to the job and, where entitled, to permit-to-work — not to generate a PDF museum. A good JSA is specific to the task, the location and the crew competency, and it is revised when the method changes. If your search is ‘JSA software’, judge the product by whether the field team will actually open it, not by how pretty the matrix looks in a demo.",
  },
  {
    slug: "capa",
    title: "CAPA",
    relatedHref: "/product/capa-tracking",
    relatedLabel: "CAPA tracking",
    body: "Corrective and Preventive Action (CAPA) is the closed loop after an incident, audit finding or inspection: contain, correct, prevent recurrence, and verify effectiveness. In many Indian sites CAPA is an Excel list with no verification date. EHS360 treats CAPA as a first-class record with owners, due dates and links back to the source event. Preventive action is not a synonym for ‘training reminder’; it should change a control, a design, or a method. Verification of effectiveness is a scheduled check, not a close-out comment. If CAPA is not entitled on a tenant plan, the module will not appear — entitlements are data, not a slogan on this page.",
  },
  {
    slug: "moc",
    title: "MOC",
    relatedHref: "/product",
    relatedLabel: "Product overview",
    body: "Management of Change (MOC) is the discipline of reviewing people, plant, process or organisational changes before they introduce new risk — classic in process industries and equally relevant when an EPC changes a method statement mid-package. EHS360 includes MOC as a product capability in the platform catalog; depth depends on tenant entitlements and the live module set. Do not read this glossary as a claim that every MOC workflow is fully built for every plan. What belongs here is the idea: unmanaged change is a leading cause of repeat incidents. Pair MOC with risk assessment, permit-to-work and document control so the changed method is the one the crew actually holds.",
  },
  {
    slug: "ngrbc",
    title: "NGRBC",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "The National Guidelines on Responsible Business Conduct (NGRBC) are the MCA/SEBI principle set that BRSR is structured around — nine principles covering ethics, worker wellbeing, environment, inclusive growth and the rest. They are guidelines for responsible business, not a software feature list. EHS360 maps operational EHS evidence (injuries, training, contractor control, some environmental tasks) into the kinds of disclosures those principles ask for, without pretending every principle is an EHS module. Company secretarial teams still own the narrative and governance sections. Use NGRBC language in reports when it is accurate; do not sprinkle it on incident forms to look ‘ESG native’.",
  },
  {
    slug: "scope-1",
    title: "Scope 1",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "Scope 1 greenhouse gas emissions are direct emissions from sources the organisation owns or controls — fuel in boilers, site DG sets, fleet fuel, process emissions. GHG Protocol language is global; Indian BRSR and many customer questionnaires still expect it. EHS360’s ESG area can hold inventory records when that module is entitled; it does not invent an organisational footprint for marketing. Accurate Scope 1 starts with activity data (litres, kWh equivalent, process counts) and emission factors you are willing to defend to an assurer. Keep the same tenant as EHS so a diesel bowser incident and a diesel consumption line are not in two companies’ worth of spreadsheets.",
  },
  {
    slug: "scope-2",
    title: "Scope 2",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "Scope 2 covers indirect emissions from purchased electricity, steam, heating and cooling. Location-based and market-based methods differ; Indian grid factors change, and RECs/PPAs need evidence. EHS360 can store inventory structure when ESG features are on the plan. It is not an energy-management system and does not pull DISCOM invoices automatically unless you integrate that later. The marketing-relevant point: Scope 2 is often the largest number for construction offices and plants, and it is still disconnected from ‘safety software’ in most stacks. Putting it in the same organisation record as incidents is the product thesis — not a claim of automated carbon accounting.",
  },
  {
    slug: "scope-3",
    title: "Scope 3",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "Scope 3 is the value-chain remainder: purchased goods, upstream transport, contractor fuel, business travel, use of sold products, and more. It is where most corporate inventories go to die in estimates. For EPC and manufacturing in India, contractor and logistics emissions are often the honest starting categories. EHS360 tracks contractors and sites as EHS objects; using those lists as a Scope 3 activity scaffold is legitimate. Publishing a complete Scope 3 total from EHS360 alone is not something we claim. Treat Scope 3 as a multi-year data programme, disclose methods, and do not let a round number outrun the evidence.",
  },
  {
    slug: "materiality",
    title: "Materiality",
    relatedHref: "/product/esg-brsr-reporting",
    relatedLabel: "ESG & BRSR reporting",
    body: "Materiality in ESG is the process of deciding which topics are significant to the business and its stakeholders — financial materiality, impact materiality, or both (double materiality). BRSR and many board ESG committees expect a documented assessment, not a copied peer list. EHS360 includes materiality as part of the ESG workspace when entitled, so the assessment lives with metrics rather than in a workshop deck. We will not invent your material topics for you. Safety, labour and environment almost always surface for industrial operators; the point of software is versioned records and links to the metrics you actually track, not a prettier matrix graphic.",
  },
];
