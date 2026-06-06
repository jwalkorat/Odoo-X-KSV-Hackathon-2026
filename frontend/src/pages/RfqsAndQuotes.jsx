import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_RFQS, MOCK_QUOTATIONS, MOCK_VENDORS, MOCK_APPROVALS } from '../mockData/mockDb';
import { formatDate, formatCurrency, getStatusBadgeClass } from '../lib/utils';
import { 
  FileText, 
  Send, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Edit3,
  Calendar,
  Sparkles,
  User,
  ShieldCheck,
  Star,
  ArrowUpDown,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Award,
  Plus
} from 'lucide-react';

const RfqsAndQuotes = () => {
  const { user } = useAuth();
  const isVendor = user?.role === 'VENDOR';

  const [rfqs, setRfqs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [approvals, setApprovals] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Common selected RFQ (for expanding details or submission form)
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [expandedRfqId, setExpandedRfqId] = useState(null);
  
  // VENDOR Form states
  const [quoteItems, setQuoteItems] = useState({}); // maps rfq_item_id -> unit_price
  const [deliveryDays, setDeliveryDays] = useState(5);
  const [notes, setNotes] = useState('');

  // OFFICER Sort & Filter states
  const [sortBy, setSortBy] = useState('price'); // 'price' | 'delivery' | 'rating'
  const [maxDeliveryDays, setMaxDeliveryDays] = useState('');
  const [minRating, setMinRating] = useState('');

  // Current vendor's ID mapping
  const currentVendorId = isVendor 
    ? (user.username === 'vendor2' ? 2 : 1) 
    : 1;

  // Load datasets
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const [rfqsRes, quotesRes, vendorsRes, approvalsRes] = await Promise.all([
        api.get('/api/rfqs'),
        api.get('/api/rfqs/quotes/all').catch(() => ({ data: [] })),
        api.get('/api/vendors'),
        api.get('/api/approvals').catch(() => ({ data: [] }))
      ]);
      
      setRfqs(rfqsRes.data);
      setVendors(vendorsRes.data);
      
      if (quotesRes.data && quotesRes.data.length > 0) {
        setQuotations(quotesRes.data);
      } else {
        const storedQuotes = localStorage.getItem('galaxy_quotations');
        if (storedQuotes) {
          setQuotations(JSON.parse(storedQuotes));
        } else {
          localStorage.setItem('galaxy_quotations', JSON.stringify(MOCK_QUOTATIONS));
          setQuotations(MOCK_QUOTATIONS);
        }
      }

      if (approvalsRes.data && approvalsRes.data.length > 0) {
        setApprovals(approvalsRes.data);
      } else {
        const storedApprovals = localStorage.getItem('galaxy_approvals');
        if (storedApprovals) {
          setApprovals(JSON.parse(storedApprovals));
        } else {
          localStorage.setItem('galaxy_approvals', JSON.stringify(MOCK_APPROVALS));
          setApprovals(MOCK_APPROVALS);
        }
      }
    } catch (err) {
      console.warn("API offline, booting local database storage sync...");
      
      let storedRfqs = localStorage.getItem('galaxy_rfqs');
      let storedQuotes = localStorage.getItem('galaxy_quotations');
      let storedVendors = localStorage.getItem('galaxy_vendors');
      let storedApprovals = localStorage.getItem('galaxy_approvals');
      
      if (!storedRfqs) {
        localStorage.setItem('galaxy_rfqs', JSON.stringify(MOCK_RFQS));
        storedRfqs = JSON.stringify(MOCK_RFQS);
      }
      if (!storedQuotes) {
        localStorage.setItem('galaxy_quotations', JSON.stringify(MOCK_QUOTATIONS));
        storedQuotes = JSON.stringify(MOCK_QUOTATIONS);
      }
      if (!storedVendors) {
        localStorage.setItem('galaxy_vendors', JSON.stringify(MOCK_VENDORS));
        storedVendors = JSON.stringify(MOCK_VENDORS);
      }
      if (!storedApprovals) {
        localStorage.setItem('galaxy_approvals', JSON.stringify(MOCK_APPROVALS));
        storedApprovals = JSON.stringify(MOCK_APPROVALS);
      }
      
      setRfqs(JSON.parse(storedRfqs));
      setQuotations(JSON.parse(storedQuotes));
      setVendors(JSON.parse(storedVendors));
      setApprovals(JSON.parse(storedApprovals));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter RFQs: Vendors only see RFQs they are invited to
  const filteredRfqs = rfqs.filter(rfq => {
    if (isVendor) {
      if (rfq.vendor_ids) return rfq.vendor_ids.includes(currentVendorId);
      if (rfq.vendor_links) return rfq.vendor_links.some(link => link.vendor_id === currentVendorId);
      return true;
    }
    return true; // Officers see all
  });

  const getVendorQuotationForRfq = (rfqId) => {
    return quotations.find(q => q.rfq_id === rfqId && q.vendor_id === currentVendorId);
  };

  const getRfqVendorStatus = (rfqId) => {
    const quote = getVendorQuotationForRfq(rfqId);
    return quote ? 'RESPONDED' : 'PENDING';
  };

  // VENDOR: Open the quotation submission view
  const handleOpenQuotationForm = (rfq) => {
    setSelectedRfq(rfq);
    setErrorMsg('');
    setSuccessMsg('');
    
    const existingQuote = getVendorQuotationForRfq(rfq.id);
    if (existingQuote) {
      const itemsMap = {};
      existingQuote.items.forEach(item => {
        itemsMap[item.rfq_item_id] = item.unit_price;
      });
      setQuoteItems(itemsMap);
      setDeliveryDays(existingQuote.delivery_days);
      setNotes(existingQuote.notes || '');
    } else {
      const itemsMap = {};
      rfq.items.forEach(item => {
        itemsMap[item.id] = '';
      });
      setQuoteItems(itemsMap);
      setDeliveryDays(5);
      setNotes('');
    }
  };

  const calculateTotal = () => {
    if (!selectedRfq) return 0;
    return selectedRfq.items.reduce((sum, item) => {
      const unitPrice = parseFloat(quoteItems[item.id]) || 0;
      return sum + (unitPrice * item.quantity);
    }, 0);
  };

  const handleUnitPriceChange = (itemId, val) => {
    if (val === '' || (/^\d*\.?\d*$/).test(val)) {
      setQuoteItems(prev => ({
        ...prev,
        [itemId]: val
      }));
    }
  };

  // VENDOR: Submit quotation
  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    const itemIds = selectedRfq.items.map(i => i.id);
    const hasInvalidPrice = itemIds.some(id => !quoteItems[id] || parseFloat(quoteItems[id]) <= 0);
    
    if (hasInvalidPrice) {
      setErrorMsg("Please specify a valid positive unit price for all items.");
      setSubmitting(false);
      return;
    }

    if (!deliveryDays || parseInt(deliveryDays) <= 0) {
      setErrorMsg("Please enter a valid delivery timeline.");
      setSubmitting(false);
      return;
    }

    const totalAmount = calculateTotal();
    const itemsPayload = selectedRfq.items.map(item => ({
      rfq_item_id: item.id,
      unit_price: parseFloat(quoteItems[item.id]),
      total_price: parseFloat(quoteItems[item.id]) * item.quantity
    }));

    const payload = {
      rfq_id: selectedRfq.id,
      vendor_id: currentVendorId,
      total_amount: totalAmount,
      delivery_days: parseInt(deliveryDays),
      notes: notes,
      items: itemsPayload
    };

    try {
      const res = await api.post(`/api/rfqs/${selectedRfq.id}/quotes`, payload);
      setSuccessMsg("Uplink successful! Your quotation has been securely saved in the database.");
      setTimeout(() => {
        setSelectedRfq(null);
        loadData();
      }, 1500);
    } catch (err) {
      console.warn("Backend API save failed. Persisting in localStorage instead.");
      
      const storedQuotes = JSON.parse(localStorage.getItem('galaxy_quotations') || '[]');
      const index = storedQuotes.findIndex(q => q.rfq_id === selectedRfq.id && q.vendor_id === currentVendorId);
      
      const newQuote = {
        id: index > -1 ? storedQuotes[index].id : (storedQuotes.length + 1),
        rfq_id: selectedRfq.id,
        vendor_id: currentVendorId,
        total_amount: totalAmount,
        delivery_days: parseInt(deliveryDays),
        notes: notes,
        status: "SUBMITTED",
        submitted_at: new Date().toISOString(),
        items: itemsPayload.map((item, idx) => ({
          id: index > -1 ? (storedQuotes[index].items[idx]?.id || Math.random()) : Math.random(),
          quotation_id: index > -1 ? storedQuotes[index].id : (storedQuotes.length + 1),
          ...item
        }))
      };

      if (index > -1) {
        storedQuotes[index] = newQuote;
      } else {
        storedQuotes.push(newQuote);
      }

      localStorage.setItem('galaxy_quotations', JSON.stringify(storedQuotes));
      
      // Seed log
      const storedLogs = JSON.parse(localStorage.getItem('galaxy_logs') || '[]');
      storedLogs.unshift({
        id: Date.now(),
        user_id: user?.id || 4,
        action: `Submitted Quotation for RFQ #${selectedRfq.id} (Local Fallback)`,
        entity_type: "Quotation",
        entity_id: newQuote.id,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('galaxy_logs', JSON.stringify(storedLogs));

      setSuccessMsg("System offline. Quotation saved locally to system buffer (localStorage).");
      setTimeout(() => {
        setSelectedRfq(null);
        loadData();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  // OFFICER: Request Manager Approval
  const handleRequestApproval = async (rfqId, quotationId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await api.post('/api/approvals/', { rfq_id: rfqId, quotation_id: quotationId });
      setSuccessMsg("Approval requested successfully. Alert dispatched to Manager console.");
      loadData();
    } catch (err) {
      console.warn("Backend API failed. Simulating approval request locally.");
      
      const storedApprovals = JSON.parse(localStorage.getItem('galaxy_approvals') || '[]');
      
      // Create new approval
      const newApproval = {
        id: storedApprovals.length + 1,
        rfq_id: rfqId,
        quotation_id: quotationId,
        requested_by_id: user?.id || 2,
        approved_by_id: null,
        status: "PENDING",
        remarks: null,
        created_at: new Date().toISOString(),
        resolved_at: null
      };
      
      storedApprovals.push(newApproval);
      localStorage.setItem('galaxy_approvals', JSON.stringify(storedApprovals));

      // Log activity
      const storedLogs = JSON.parse(localStorage.getItem('galaxy_logs') || '[]');
      storedLogs.unshift({
        id: Date.now(),
        user_id: user?.id || 2,
        action: `Requested approval for Quotation #${quotationId} on RFQ #${rfqId} (Local Fallback)`,
        entity_type: "Approval",
        entity_id: newApproval.id,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('galaxy_logs', JSON.stringify(storedLogs));

      setSuccessMsg("Approval request cached locally in system buffer (localStorage).");
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Get quotations for an RFQ
  const getQuotesForRfq = (rfqId) => {
    return quotations.filter(q => q.rfq_id === rfqId).map(q => {
      // populate vendor from list if not present
      const vendorDetail = q.vendor || vendors.find(v => v.id === q.vendor_id);
      return { ...q, vendor: vendorDetail };
    });
  };

  // Helper: Get approval for an RFQ
  const getApprovalForRfq = (rfqId) => {
    return approvals.find(a => a.rfq_id === rfqId);
  };

  // Sort & Filter quotations for comparison table
  const processQuotationComparison = (quotes) => {
    // 1. Filter
    let processed = quotes.filter(q => {
      if (maxDeliveryDays && q.delivery_days > parseInt(maxDeliveryDays)) return false;
      const rating = q.vendor?.rating || 5.0;
      if (minRating && rating < parseFloat(minRating)) return false;
      return true;
    });

    // 2. Sort
    processed.sort((a, b) => {
      if (sortBy === 'price') {
        return a.total_amount - b.total_amount;
      }
      if (sortBy === 'delivery') {
        return a.delivery_days - b.delivery_days;
      }
      if (sortBy === 'rating') {
        const ratingA = a.vendor?.rating || 0;
        const ratingB = b.vendor?.rating || 0;
        return ratingB - ratingA;
      }
      return 0;
    });

    return processed;
  };

  // Helper to find the lowest price for an item across compared quotes
  const getLowestUnitPriceForItem = (rfqItemId, comparedQuotes) => {
    if (comparedQuotes.length === 0) return 0;
    const prices = comparedQuotes.map(q => {
      const item = q.items.find(i => i.rfq_item_id === rfqItemId);
      return item ? item.unit_price : Infinity;
    });
    return Math.min(...prices);
  };

  // Helper to find the lowest total bid
  const getLowestTotalAmount = (comparedQuotes) => {
    if (comparedQuotes.length === 0) return 0;
    return Math.min(...comparedQuotes.map(q => q.total_amount));
  };

  // Helper to find the fastest delivery days
  const getFastestDelivery = (comparedQuotes) => {
    if (comparedQuotes.length === 0) return 0;
    return Math.min(...comparedQuotes.map(q => q.delivery_days));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-mono text-xs tracking-widest uppercase">Connecting with Command Deck...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* VENDOR VIEW BLOCK */}
      {isVendor && (
        <>
          {/* Page Header banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/20 via-indigo-950/30 to-cyan-950/10 border border-violet-500/10 p-6 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono mb-1 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Telemetry Active</span>
              </div>
              <h2 className="font-outfit font-extrabold text-xl md:text-2xl text-slate-100 uppercase">
                Vendor Quotation Submission
              </h2>
              <p className="text-slate-400 text-xs mt-1 max-w-xl">
                Submit and modify pricing matrices for active resource invitations.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2.5 px-4 py-2 rounded-lg bg-slate-900/60 border border-violet-500/15">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-glow-emerald"></div>
              <div className="font-mono text-xs">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Terminal User</span>
                <span className="text-cyan-400 font-semibold uppercase">{user?.username}</span>
              </div>
            </div>
          </div>

          {!selectedRfq ? (
            <div className="space-y-4">
              <h3 className="font-outfit font-bold text-slate-200 text-base flex items-center space-x-2">
                <FileText className="w-4 h-4 text-violet-400" />
                <span>Resource Requisition Assignments</span>
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {filteredRfqs.map((rfq) => {
                  const hasQuote = getVendorQuotationForRfq(rfq.id);
                  const status = getRfqVendorStatus(rfq.id);
                  
                  return (
                    <div 
                      key={rfq.id} 
                      className={`glass-panel rounded-xl p-5 border transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        status === 'RESPONDED' 
                          ? 'border-emerald-500/15 hover:border-emerald-500/30' 
                          : 'border-amber-500/10 hover:border-cyan-400/30'
                      }`}
                    >
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-violet-500/25">
                            RFQ-00{rfq.id}
                          </span>
                          <span className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                            status === 'RESPONDED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {status === 'RESPONDED' ? 'RESPONDED' : 'PENDING ACTION'}
                          </span>
                          {status === 'RESPONDED' && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Bid: {formatCurrency(hasQuote.total_amount)}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-outfit font-bold text-slate-200 text-base leading-snug">
                          {rfq.title}
                        </h4>
                        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                          {rfq.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-slate-500 font-mono text-[10px]">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-violet-400" />
                            <span>Deadline: {formatDate(rfq.deadline)}</span>
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                          <span>Items: {rfq.items?.length || 0} required</span>
                        </div>
                      </div>

                      <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
                        <button
                          onClick={() => handleOpenQuotationForm(rfq)}
                          className={`w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 ${
                            status === 'RESPONDED'
                              ? 'bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              : 'cosmic-btn-primary shadow-glow-cyan'
                          }`}
                        >
                          {status === 'RESPONDED' ? (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Modify Bid Matrix</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit Quote</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredRfqs.length === 0 && (
                  <div className="glass-panel rounded-xl p-12 text-center border border-violet-500/10">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">No invited RFQs detected in your quadrant.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vendor Quote submission Form */
            <div className="glass-panel rounded-xl border border-violet-500/15 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-violet-500/10 pb-4">
                <button 
                  onClick={() => setSelectedRfq(null)}
                  className="flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Orbit Back to Registry</span>
                </button>
                <div className="text-[10px] font-mono text-slate-500">
                  UPLINK: RFQ-00{selectedRfq.id}
                </div>
              </div>

              {/* RFQ Reference Details */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-violet-500/10 space-y-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-violet-400">Requisition Package Description</span>
                <h4 className="font-outfit font-bold text-slate-200 text-base">{selectedRfq.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{selectedRfq.description}</p>
                <div className="flex items-center space-x-2 pt-2 text-[10px] font-mono text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bid Threshold Deadline: {formatDate(selectedRfq.deadline)}</span>
                </div>
              </div>

              {successMsg && (
                <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-5 h-5 shrink-0 animate-bounce" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-red-950/20 border border-red-500/25 text-red-400 text-xs font-mono">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitQuotation} className="space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-500 block">
                    Line Item Unit Pricing Matrix
                  </span>
                  
                  <div className="overflow-x-auto rounded-xl border border-violet-500/10 bg-slate-950/20">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-violet-500/10 bg-slate-900/40 text-slate-400">
                          <th className="p-3">Product Name & Specifications</th>
                          <th className="p-3 text-center">Req. Qty</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3 w-40">Unit Price (INR)</th>
                          <th className="p-3 text-right">Subtotal (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-violet-500/5">
                        {selectedRfq.items?.map((item) => {
                          const unitPrice = quoteItems[item.id] || '';
                          const subtotal = (parseFloat(unitPrice) || 0) * item.quantity;
                          
                          return (
                            <tr key={item.id} className="hover:bg-slate-900/20 text-slate-300">
                              <td className="p-3">
                                <div className="font-semibold text-slate-200">{item.product_name}</div>
                                {item.specifications && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">{item.specifications}</div>
                                )}
                              </td>
                              <td className="p-3 text-center font-bold text-slate-200">{item.quantity}</td>
                              <td className="p-3 text-slate-400">{item.unit}</td>
                              <td className="p-3">
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2.5 text-slate-600 text-[10px]">₹</span>
                                  <input
                                    type="text"
                                    value={unitPrice}
                                    onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-950/80 border border-violet-500/15 rounded pl-6 pr-2 py-1.5 focus:outline-none focus:border-cyan-400 text-cyan-300"
                                    required
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-right font-bold text-slate-200">
                                {formatCurrency(subtotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <div className="glass-panel border border-violet-500/10 rounded-xl px-6 py-4 flex items-center space-x-12">
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Gross Calculated Bid Amount</span>
                    <span className="text-xl font-mono font-extrabold text-cyan-400">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-cyan-400 uppercase mb-2">
                      Delivery Timeline (Days)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                      <input
                        type="number"
                        min="1"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                        placeholder="Days to deliver"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono tracking-wider text-cyan-400 uppercase mb-2">
                      Vendor Notes & Quotation Comments
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 font-sans h-20 placeholder-slate-600"
                      placeholder="Include warranty terms, logistics notes..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 border-t border-violet-500/10 pt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedRfq(null)}
                    className="px-5 py-2.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent transition"
                  >
                    Abort Requisition
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-mono font-bold cosmic-btn-primary shadow-glow-cyan"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Transmitting Bids...' : 'Transmit Bid Matrix'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* OFFICER/ADMIN VIEW BLOCK (QUOTATION COMPARISON) */}
      {!isVendor && (
        <>
          {/* Page Header banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/20 via-indigo-950/30 to-cyan-950/10 border border-violet-500/10 p-6 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono mb-1 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Command Cleared</span>
              </div>
              <h2 className="font-outfit font-extrabold text-xl md:text-2xl text-slate-100 uppercase">
                RFQ & Quotation Deck
              </h2>
              <p className="text-slate-400 text-xs mt-1 max-w-xl">
                Compare side-by-side vendor bids, verify rating profiles, and dispatch approval requests.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2.5 px-4 py-2 rounded-lg bg-slate-900/60 border border-violet-500/15">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-glow-cyan"></div>
              <div className="font-mono text-xs">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Terminal User</span>
                <span className="text-cyan-400 font-semibold uppercase">{user?.username} ({user?.role})</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-outfit font-bold text-slate-200 text-base flex items-center space-x-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <span>All Active & Closed RFQ Packages</span>
            </h3>

            {successMsg && (
              <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/25 text-emerald-400 text-xs font-mono shadow-lg">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {filteredRfqs.map((rfq) => {
                const isExpanded = expandedRfqId === rfq.id;
                const rfqQuotes = getQuotesForRfq(rfq.id);
                const approval = getApprovalForRfq(rfq.id);
                
                // Processed Quotes (Filtered and Sorted)
                const processedQuotes = processQuotationComparison(rfqQuotes);
                
                // Lowest price highlights
                const lowestTotal = getLowestTotalAmount(processedQuotes);
                const fastestDelivery = getFastestDelivery(processedQuotes);

                return (
                  <div 
                    key={rfq.id} 
                    className={`glass-panel rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded ? 'border-violet-500/35 ring-1 ring-violet-500/20' : 'border-violet-500/10 hover:border-cyan-400/35'
                    }`}
                  >
                    {/* Header Row */}
                    <div 
                      onClick={() => setExpandedRfqId(isExpanded ? null : rfq.id)}
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-900/10"
                    >
                      <div className="space-y-1 max-w-3xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-violet-500/25">
                            RFQ-00{rfq.id}
                          </span>
                          <span className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                            rfq.status === 'CLOSED'
                              ? 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            {rfq.status}
                          </span>
                          {approval && (
                            <span className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                              approval.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : approval.status === 'REJECTED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              Approval: {approval.status}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {rfqQuotes.length} Vendor Quotes
                          </span>
                        </div>
                        <h4 className="font-outfit font-bold text-slate-200 text-sm">{rfq.title}</h4>
                      </div>
                      <div className="text-slate-400 hover:text-slate-200 p-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-5 border-t border-violet-500/10 bg-slate-950/20 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Description</span>
                            <p className="text-slate-300 mt-1 leading-relaxed">{rfq.description}</p>
                          </div>
                          <div className="flex flex-col justify-end space-y-2 md:items-end">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Temporal Limit</span>
                            <div className="flex items-center space-x-1.5 text-slate-300 mt-0.5 font-mono">
                              <Calendar className="w-4 h-4 text-cyan-400" />
                              <span>Deadline: {formatDate(rfq.deadline)}</span>
                            </div>
                          </div>
                        </div>

                        {/* COMPARISON AND ACTION SECTION */}
                        <div className="space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-violet-500/10 pb-3">
                            <h5 className="font-outfit font-bold text-slate-200 text-sm flex items-center space-x-2">
                              <Award className="w-4 h-4 text-yellow-400" />
                              <span>Vendor Bid Comparison Matrix</span>
                            </h5>

                            {/* Sort & Filter Controls */}
                            {rfqQuotes.length > 0 && (
                              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                                {/* Sort Dropdown */}
                                <div className="flex items-center space-x-2 bg-slate-950/80 border border-violet-500/15 rounded px-2.5 py-1 text-slate-400">
                                  <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                                  <span className="text-[10px] text-slate-500 uppercase">Sort:</span>
                                  <select 
                                    value={sortBy} 
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent focus:outline-none border-none text-slate-200"
                                  >
                                    <option value="price">Lowest Total Cost</option>
                                    <option value="delivery">Fastest Timeline</option>
                                    <option value="rating">Highest Vendor Rating</option>
                                  </select>
                                </div>

                                {/* Delivery Filter */}
                                <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-violet-500/15 rounded px-2 py-0.5 text-slate-300 w-32">
                                  <Filter className="w-3 h-3 text-violet-400 shrink-0" />
                                  <input 
                                    type="number"
                                    placeholder="Max Days"
                                    value={maxDeliveryDays}
                                    onChange={(e) => setMaxDeliveryDays(e.target.value)}
                                    className="bg-transparent focus:outline-none border-none text-[10px] w-full text-cyan-400 font-mono"
                                  />
                                </div>

                                {/* Rating Filter */}
                                <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-violet-500/15 rounded px-2 py-0.5 text-slate-300 w-32">
                                  <Star className="w-3 h-3 text-yellow-400 shrink-0" />
                                  <input 
                                    type="number"
                                    step="0.1"
                                    placeholder="Min Rating"
                                    value={minRating}
                                    onChange={(e) => setMinRating(e.target.value)}
                                    className="bg-transparent focus:outline-none border-none text-[10px] w-full text-cyan-400 font-mono"
                                  />
                                </div>

                                {/* Clear Filters */}
                                {(maxDeliveryDays || minRating) && (
                                  <button 
                                    onClick={() => { setMaxDeliveryDays(''); setMinRating(''); }}
                                    className="text-red-400 text-[10px] hover:underline hover:text-red-300 shrink-0"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {rfqQuotes.length === 0 ? (
                            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-violet-500/5 text-slate-500">
                              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                              <p className="text-xs">No vendor quotes submitted yet for this requisition.</p>
                            </div>
                          ) : processedQuotes.length === 0 ? (
                            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-violet-500/5 text-slate-500">
                              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                              <p className="text-xs">All submitted bids are excluded by current filters.</p>
                            </div>
                          ) : (
                            /* COMPARISON TABLE */
                            <div className="overflow-x-auto rounded-xl border border-violet-500/10 bg-slate-950/40">
                              <table className="w-full text-left border-collapse text-xs font-mono min-w-[600px]">
                                <thead>
                                  <tr className="border-b border-violet-500/10 bg-slate-900/40 text-slate-400">
                                    <th className="p-3 w-72">Resource Specs</th>
                                    {processedQuotes.map((q) => (
                                      <th key={q.id} className="p-3 text-center border-l border-violet-500/10">
                                        <div className="font-bold text-slate-200 text-sm truncate max-w-[150px] mx-auto">
                                          {q.vendor?.name}
                                        </div>
                                        <div className="flex items-center justify-center space-x-1.5 mt-1">
                                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                          <span className="text-[10px] text-yellow-400 font-bold">
                                            {q.vendor?.rating?.toFixed(1) || '5.0'}
                                          </span>
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-violet-500/5">
                                  {/* Line Items Rows */}
                                  {rfq.items?.map((item) => {
                                    const lowestItemPrice = getLowestUnitPriceForItem(item.id, processedQuotes);

                                    return (
                                      <tr key={item.id} className="hover:bg-slate-900/10 text-slate-300">
                                        <td className="p-3">
                                          <div className="font-semibold text-slate-200">{item.product_name}</div>
                                          <div className="text-[10px] text-slate-500">Req: {item.quantity} {item.unit}</div>
                                        </td>
                                        {processedQuotes.map((q) => {
                                          const itemQuote = q.items.find(i => i.rfq_item_id === item.id);
                                          const unitPrice = itemQuote?.unit_price || 0;
                                          const isLowest = unitPrice === lowestItemPrice && lowestItemPrice > 0;

                                          return (
                                            <td 
                                              key={q.id} 
                                              className={`p-3 text-center border-l border-violet-500/10 transition-colors ${
                                                isLowest ? 'bg-emerald-500/10 text-emerald-300 font-semibold' : ''
                                              }`}
                                            >
                                              <div className="text-slate-200">
                                                {formatCurrency(unitPrice)} <span className="text-[9px] text-slate-500">/ unit</span>
                                              </div>
                                              <div className="text-[10px] text-slate-400 mt-0.5">
                                                Total: {formatCurrency(unitPrice * item.quantity)}
                                              </div>
                                              {isLowest && (
                                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 uppercase tracking-widest font-bold">
                                                  Lowest Cost
                                                </span>
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}

                                  {/* Total Price Row */}
                                  <tr className="border-t border-violet-500/10 bg-slate-900/20 font-semibold">
                                    <td className="p-3 text-slate-400 uppercase tracking-wider text-[10px]">Gross Bid Value</td>
                                    {processedQuotes.map((q) => {
                                      const isLowest = q.total_amount === lowestTotal;
                                      return (
                                        <td 
                                          key={q.id} 
                                          className={`p-3 text-center border-l border-violet-500/10 text-sm font-mono ${
                                            isLowest ? 'bg-emerald-500/20 text-emerald-300 border-y border-emerald-500/30' : 'text-cyan-400'
                                          }`}
                                        >
                                          <div className="font-extrabold">{formatCurrency(q.total_amount)}</div>
                                          {isLowest && (
                                            <span className="inline-block mt-0.5 px-2 py-0.5 text-[8px] bg-emerald-500 text-slate-950 rounded uppercase tracking-wider font-extrabold font-outfit shadow-glow-emerald">
                                              Winner Cost
                                            </span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>

                                  {/* Delivery Days Row */}
                                  <tr className="bg-slate-900/10">
                                    <td className="p-3 text-slate-400 uppercase tracking-wider text-[10px]">Delivery Timeline</td>
                                    {processedQuotes.map((q) => {
                                      const isFastest = q.delivery_days === fastestDelivery;
                                      return (
                                        <td 
                                          key={q.id} 
                                          className={`p-3 text-center border-l border-violet-500/10 font-bold ${
                                            isFastest ? 'text-amber-300 bg-amber-500/10' : 'text-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-center space-x-1">
                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                            <span>{q.delivery_days} Light-Days</span>
                                          </div>
                                          {isFastest && (
                                            <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.5 rounded inline-block mt-1 uppercase font-bold tracking-wider">
                                              Fastest
                                            </span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>

                                  {/* Notes Row */}
                                  <tr>
                                    <td className="p-3 text-slate-400 uppercase tracking-wider text-[10px]">Vendor Telemetry Remarks</td>
                                    {processedQuotes.map((q) => (
                                      <td key={q.id} className="p-3 text-center border-l border-violet-500/10 text-[10px] text-slate-400 italic max-w-[200px]">
                                        "{q.notes || 'No remarks provided.'}"
                                      </td>
                                    ))}
                                  </tr>

                                  {/* Approval Actions Row */}
                                  <tr className="bg-slate-900/30 border-t border-violet-500/10">
                                    <td className="p-3 text-slate-400 uppercase tracking-wider text-[10px]">Approval Telemetry</td>
                                    {processedQuotes.map((q) => {
                                      const hasApproval = getApprovalForRfq(rfq.id);
                                      const isApprovedForThis = hasApproval?.quotation_id === q.id;

                                      return (
                                        <td key={q.id} className="p-3 text-center border-l border-violet-500/10">
                                          {hasApproval ? (
                                            isApprovedForThis ? (
                                              <div className="flex flex-col items-center justify-center text-xs space-y-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                  hasApproval.status === 'APPROVED' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                    : hasApproval.status === 'REJECTED'
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                                }`}>
                                                  {hasApproval.status} FOR THIS BID
                                                </span>
                                                {hasApproval.remarks && (
                                                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                                                    "{hasApproval.remarks}"
                                                  </span>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-[10px] text-slate-600 font-sans italic">
                                                Alternative Bid Requested
                                              </span>
                                            )
                                          ) : rfq.status === 'CLOSED' || rfq.status === 'CANCELLED' ? (
                                            <span className="text-[10px] text-slate-600 font-sans">
                                              RFQ Inactive
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => handleRequestApproval(rfq.id, q.id)}
                                              disabled={submitting}
                                              className="w-full max-w-[150px] mx-auto py-1.5 px-3 rounded bg-violet-600 hover:bg-violet-500 text-white font-mono text-[10px] font-bold transition duration-150"
                                            >
                                              Uplink Approval
                                            </button>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredRfqs.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center border border-violet-500/10">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No active RFQs detected in system registry.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RfqsAndQuotes;
