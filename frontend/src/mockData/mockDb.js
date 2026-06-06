// Fallback Mock database for parallel frontend development
export const MOCK_VENDORS = [
  { id: 1, name: "Nebula IT Solutions", category: "IT", gst_number: "24ABCDE1234F1Z1", contact_email: "nebula@gmail.com", contact_phone: "9876543210", address: "Asteroid Belt Office 404, Sector 7", status: "ACTIVE", rating: 4.8 },
  { id: 2, name: "Supernova Raw Materials Corp", category: "Raw Materials", gst_number: "24XYZAB5678C1Z2", contact_email: "supernova@gmail.com", contact_phone: "9876543211", address: "Quantum Foundry Complex, Sector 9", status: "ACTIVE", rating: 4.5 },
  { id: 3, name: "Hyperdrive Logistics", category: "Logistics", gst_number: "24QWERT9012D1Z3", contact_email: "logistics@hyperdrive.com", contact_phone: "9876543212", address: "Docking Bay 12, Gandhinagar Port", status: "ACTIVE", rating: 4.2 },
  { id: 4, name: "Orion Catering Services", category: "Services", gst_number: "24MNBVC3456E1Z4", contact_email: "orion@catering.com", contact_phone: "9876543213", address: "Food Terminal Beta, Sector 3", status: "INACTIVE", rating: 3.9 }
];

export const MOCK_RFQS = [
  {
    id: 1,
    title: "Quantum Server Infrastructure Upgrade",
    description: "Procurement of high-performance quantum servers and fiber optics for the Gandhinagar ground control base.",
    deadline: "2026-06-13T09:00:00Z",
    status: "OPEN",
    created_by_id: 2,
    created_at: "2026-06-06T03:00:00Z",
    items: [
      { id: 1, rfq_id: 1, product_name: "Quantum Compute Core Node v3", quantity: 5, unit: "pcs", specifications: "256 qubits, liquid helium cooled" },
      { id: 2, rfq_id: 1, product_name: "Tachyon Fiber Optic Cable 10km", quantity: 1, unit: "pcs", specifications: "100 Gbps zero-latency throughput" }
    ],
    vendor_ids: [1, 2]
  },
  {
    id: 2,
    title: "Asteroid Shield Titanium Sheeting",
    description: "Purchase of high-tensile titanium grade 5 panels for solar shield replenishment.",
    deadline: "2026-06-10T12:00:00Z",
    status: "DRAFT",
    created_by_id: 2,
    created_at: "2026-06-06T03:30:00Z",
    items: [
      { id: 3, rfq_id: 2, product_name: "Titanium Sheet Grade 5 (4x8ft)", quantity: 150, unit: "pcs", specifications: "Thickness 12mm, anodized coat" }
    ],
    vendor_ids: [2]
  }
];

export const MOCK_QUOTATIONS = [
  {
    id: 1,
    rfq_id: 1,
    vendor_id: 1,
    total_amount: 1250000.0,
    delivery_days: 5,
    notes: "Can deliver within 5 light-days. 1 year stellar warranty included.",
    status: "SUBMITTED",
    submitted_at: "2026-06-06T04:15:00Z",
    items: [
      { id: 1, quotation_id: 1, rfq_item_id: 1, unit_price: 200000.0, total_price: 1000000.0 },
      { id: 2, quotation_id: 1, rfq_item_id: 2, unit_price: 250000.0, total_price: 250000.0 }
    ]
  },
  {
    id: 2,
    rfq_id: 1,
    vendor_id: 2,
    total_amount: 1150000.0,
    delivery_days: 8,
    notes: "Slightly longer lead time but lower pricing on Tachyon cabling.",
    status: "SUBMITTED",
    submitted_at: "2026-06-06T04:30:00Z",
    items: [
      { id: 3, quotation_id: 2, rfq_item_id: 1, unit_price: 210000.0, total_price: 1050000.0 },
      { id: 4, quotation_id: 2, rfq_item_id: 2, unit_price: 100000.0, total_price: 100000.0 }
    ]
  }
];

export const MOCK_APPROVALS = [
  {
    id: 1,
    rfq_id: 1,
    quotation_id: 2,
    requested_by_id: 2,
    approved_by_id: null,
    status: "PENDING",
    remarks: null,
    created_at: "2026-06-06T05:00:00Z",
    resolved_at: null
  }
];

export const MOCK_ORDERS = [
  {
    id: 1,
    po_number: "PO-2026-0001",
    rfq_id: 1,
    quotation_id: 2,
    vendor_id: 2,
    status: "ISSUED",
    total_amount: 1150000.0,
    issued_at: "2026-06-06T05:30:00Z"
  }
];

export const MOCK_INVOICES = [
  {
    id: 1,
    invoice_number: "INV-2026-0001",
    po_id: 1,
    vendor_id: 2,
    subtotal: 1150000.0,
    tax_percent: 18.0,
    tax_amount: 207000.0,
    total: 1357000.0,
    status: "DRAFT",
    created_at: "2026-06-06T06:00:00Z",
    sent_at: null
  }
];

export const MOCK_LOGS = [
  { id: 1, user_id: 2, action: "Created RFQ 'Quantum Server Infrastructure Upgrade'", entity_type: "RFQ", entity_id: 1, created_at: "2026-06-06T03:00:00Z" },
  { id: 2, user_id: 2, action: "Invited Nebula IT and Supernova Materials", entity_type: "RFQ", entity_id: 1, created_at: "2026-06-06T03:05:00Z" },
  { id: 3, user_id: 4, action: "Submitted Quotation for RFQ #1", entity_type: "Quotation", entity_id: 1, created_at: "2026-06-06T04:15:00Z" },
  { id: 4, user_id: 5, action: "Submitted Quotation for RFQ #1", entity_type: "Quotation", entity_id: 2, created_at: "2026-06-06T04:30:00Z" },
  { id: 5, user_id: 2, action: "Requested approval for Quotation #2 (Supernova Materials)", entity_type: "Approval", entity_id: 1, created_at: "2026-06-06T05:00:00Z" }
];
