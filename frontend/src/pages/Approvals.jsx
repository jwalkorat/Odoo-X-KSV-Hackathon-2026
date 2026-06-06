import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_RFQS, MOCK_QUOTATIONS, MOCK_APPROVALS, MOCK_VENDORS, MOCK_ORDERS } from '../mockData/mockDb';
import { formatDate, formatCurrency } from '../lib/utils';
import { 
  CheckSquare, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';

const Approvals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // Selected approval request for detailed view
  const [selectedApproval, setSelectedApproval] = useState(null);
  
  // Manager Input remarks
  const [remarks, setRemarks] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load datasets
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const [rfqsRes, quotesRes, vendorsRes, approvalsRes] = await Promise.all([
        api.get('/api/rfqs'),
        api.get('/api/rfqs/quotes/all').catch(() => ({ data: [] })),
        api.get('/api/vendors'),
        api.get('/api/approvals')
      ]);
      
      setRfqs(rfqsRes.data);
      setVendors(vendorsRes.data);
      
      if (quotesRes.data && quotesRes.data.length > 0) {
        setQuotations(quotesRes.data);
      } else {
        const storedQuotes = localStorage.getItem('galaxy_quotations') || JSON.stringify(MOCK_QUOTATIONS);
        setQuotations(JSON.parse(storedQuotes));
      }

      setApprovals(approvalsRes.data);
    } catch (err) {
      console.warn("API offline, booting local database storage sync for approvals...");
      
      let storedRfqs = localStorage.getItem('galaxy_rfqs') || JSON.stringify(MOCK_RFQS);
      let storedQuotes = localStorage.getItem('galaxy_quotations') || JSON.stringify(MOCK_QUOTATIONS);
      let storedVendors = localStorage.getItem('galaxy_vendors') || JSON.stringify(MOCK_VENDORS);
      let storedApprovals = localStorage.getItem('galaxy_approvals') || JSON.stringify(MOCK_APPROVALS);
      
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

  // Helper: Retrieve detailed data for a specific approval
  const getApprovalPackage = (approval) => {
    if (!approval) return null;
    
    const rfq = rfqs.find(r => r.id === approval.rfq_id) || approval.rfq;
    const quote = quotations.find(q => q.id === approval.quotation_id) || approval.quotation;
    
    let vendorDetail = null;
    if (quote) {
      vendorDetail = quote.vendor || vendors.find(v => v.id === quote.vendor_id);
    }
    
    // Fetch all quotes submitted for this RFQ to render the comparison table
    const allQuotesForRfq = quotations.filter(q => q.rfq_id === approval.rfq_id).map(q => {
      const v = q.vendor || vendors.find(vend => vend.id === q.vendor_id);
      return { ...q, vendor: v };
    });

    return {
      rfq,
      quote: quote ? { ...quote, vendor: vendorDetail } : null,
      allQuotes: allQuotesForRfq
    };
  };

  const handleSelectApproval = (approval) => {
    setSelectedApproval(approval);
    setRemarks(approval.remarks || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Resolve Approval (Approve / Reject)
  const handleResolveApproval = async (status) => {
    if (!selectedApproval) return;
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      // POST to backend API /api/approvals/{id}/resolve
      const res = await api.post(`/api/approvals/${selectedApproval.id}/resolve`, {
        status: status,
        remarks: remarks
      });

      setSuccessMsg(`Decision logged! Package was successfully ${status.toUpperCase()}.`);
      
      // Update local state
      setApprovals(prev => prev.map(a => a.id === selectedApproval.id ? res.data : a));
      setSelectedApproval(res.data);
      
      setTimeout(() => {
        setSuccessMsg('');
        loadData();
      }, 1500);
    } catch (err) {
      console.warn("Backend API resolve failed. Simulating locally in localStorage.");
      
      const storedApprovals = JSON.parse(localStorage.getItem('galaxy_approvals') || '[]');
      const index = storedApprovals.findIndex(a => a.id === selectedApproval.id);
      
      if (index > -1) {
        const updatedApproval = {
          ...storedApprovals[index],
          status: status.toUpperCase(),
          remarks: remarks,
          resolved_at: new Date().toISOString(),
          approved_by_id: user?.id || 3
        };
        storedApprovals[index] = updatedApproval;
        localStorage.setItem('galaxy_approvals', JSON.stringify(storedApprovals));

        // If APPROVED, simulate Purchase Order generation
        if (status === 'APPROVED') {
          const storedOrders = JSON.parse(localStorage.getItem('galaxy_orders') || '[]');
          const rfq = rfqs.find(r => r.id === selectedApproval.rfq_id);
          const quote = quotations.find(q => q.id === selectedApproval.quotation_id);
          
          const newOrder = {
            id: storedOrders.length + 1,
            po_number: `PO-${new Date().getFullYear()}-${String(storedOrders.length + 1).padStart(4, '0')}`,
            rfq_id: selectedApproval.rfq_id,
            quotation_id: selectedApproval.quotation_id,
            vendor_id: quote ? quote.vendor_id : 1,
            status: "ISSUED",
            total_amount: quote ? quote.total_amount : 0.0,
            issued_at: new Date().toISOString()
          };
          storedOrders.push(newOrder);
          localStorage.setItem('galaxy_orders', JSON.stringify(storedOrders));

          // Also close RFQ in local storage
          const storedRfqs = JSON.parse(localStorage.getItem('galaxy_rfqs') || '[]');
          const rfqIndex = storedRfqs.findIndex(r => r.id === selectedApproval.rfq_id);
          if (rfqIndex > -1) {
            storedRfqs[rfqIndex].status = "CLOSED";
            localStorage.setItem('galaxy_rfqs', JSON.stringify(storedRfqs));
          }
        }

        // Log audit trail
        const storedLogs = JSON.parse(localStorage.getItem('galaxy_logs') || '[]');
        storedLogs.unshift({
          id: Date.now(),
          user_id: user?.id || 3,
          action: `${status.toUpperCase()} quotation package for RFQ #${selectedApproval.rfq_id} (Local Fallback)`,
          entity_type: "Approval",
          entity_id: selectedApproval.id,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('galaxy_logs', JSON.stringify(storedLogs));

        setSuccessMsg(`System offline. Decision resolved locally (${status.toUpperCase()}).`);
        setApprovals(storedApprovals);
        setSelectedApproval(updatedApproval);
        
        setTimeout(() => {
          setSuccessMsg('');
          loadData();
        }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getLowestUnitPriceForItem = (rfqItemId, comparedQuotes) => {
    if (comparedQuotes.length === 0) return 0;
    const prices = comparedQuotes.map(q => {
      const item = q.items.find(i => i.rfq_item_id === rfqItemId);
      return item ? item.unit_price : Infinity;
    });
    return Math.min(...prices);
  };

  const pkg = getApprovalPackage(selectedApproval);

  return (
    <div className="space-y-6">
      {/* Page Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/20 via-indigo-950/30 to-cyan-950/10 border border-violet-500/10 p-6 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono mb-1 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
            <span>Management Console Cleared</span>
          </div>
          <h2 className="font-outfit font-extrabold text-xl md:text-2xl text-slate-100 uppercase">
            Approvals Workflow Console
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xl">
            Authorize and reject procurement packets. Approved contracts automatically spawn Purchase Orders.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2.5 px-4 py-2 rounded-lg bg-slate-900/60 border border-violet-500/15">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse shadow-glow-purple"></div>
          <div className="font-mono text-xs">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Clearance Level</span>
            <span className="text-cyan-400 font-semibold uppercase">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Approval Requests Queue */}
        <div className="space-y-4 lg:col-span-1">
          <h3 className="font-outfit font-bold text-slate-200 text-base flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-violet-400" />
            <span>Requisition Pending Queue</span>
          </h3>

          <div className="space-y-3">
            {approvals.map((app) => {
              const rfqDetail = rfqs.find(r => r.id === app.rfq_id) || app.rfq;
              const quoteDetail = quotations.find(q => q.id === app.quotation_id) || app.quotation;
              const isSelected = selectedApproval?.id === app.id;

              return (
                <div
                  key={app.id}
                  onClick={() => handleSelectApproval(app)}
                  className={`glass-panel rounded-xl p-4 border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'border-cyan-400 bg-slate-900/35 ring-1 ring-cyan-500/20' 
                      : 'border-violet-500/10 hover:border-violet-500/35 hover:bg-slate-900/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-violet-500/20">
                      APP-00{app.id}
                    </span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                      app.status === 'APPROVED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : app.status === 'REJECTED'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <h4 className="font-outfit font-bold text-slate-200 text-xs line-clamp-1">
                    {rfqDetail?.title || `RFQ Reference #${app.rfq_id}`}
                  </h4>

                  {quoteDetail && (
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2">
                      <span>Val: {formatCurrency(quoteDetail.total_amount)}</span>
                      <span>Lead: {quoteDetail.delivery_days} days</span>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-600 font-mono mt-1 pt-1.5 border-t border-violet-500/5">
                    Requested: {formatDate(app.created_at)}
                  </div>
                </div>
              );
            })}

            {approvals.length === 0 && (
              <div className="glass-panel rounded-xl p-8 text-center border border-violet-500/10">
                <AlertCircle className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-xs">No approval requests loaded in current quadrant.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed View Deck */}
        <div className="lg:col-span-2">
          {selectedApproval && pkg ? (
            <div className="glass-panel rounded-xl border border-violet-500/15 p-6 space-y-6">
              
              {/* Detailed View Header */}
              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-violet-500/10 pb-4">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-violet-400">Approval Deck details</span>
                  <h3 className="font-outfit font-extrabold text-base text-slate-100">
                    {pkg.rfq?.title}
                  </h3>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  UPLINK ID: APP-00{selectedApproval.id}
                </div>
              </div>

              {/* TIMELINE STEPPER (STRETCH) */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Procurement Lifecycle Progress
                </span>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  {/* Step 1: RFQ */}
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center mx-auto mb-1 text-xs">
                      ✓
                    </div>
                    <span className="text-slate-300 font-bold block">RFQ Broadcast</span>
                    <span className="text-[8px] text-slate-500">Log Synced</span>
                  </div>

                  {/* Step 2: Quotations */}
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center mx-auto mb-1 text-xs">
                      ✓
                    </div>
                    <span className="text-slate-300 font-bold block">Bids Logged</span>
                    <span className="text-[8px] text-slate-500">{pkg.allQuotes?.length} Quotes</span>
                  </div>

                  {/* Step 3: Approval Request */}
                  <div className="relative">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center mx-auto mb-1 text-xs ${
                      selectedApproval.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : selectedApproval.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-400 border-red-500'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500 animate-pulse'
                    }`}>
                      {selectedApproval.status === 'APPROVED' ? '✓' : selectedApproval.status === 'REJECTED' ? '✕' : '3'}
                    </div>
                    <span className="text-slate-300 font-bold block">Manager Review</span>
                    <span className="text-[8px] text-slate-500">{selectedApproval.status}</span>
                  </div>

                  {/* Step 4: PO generation */}
                  <div className="relative">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center mx-auto mb-1 text-xs ${
                      selectedApproval.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-slate-900 text-slate-600 border-slate-800'
                    }`}>
                      {selectedApproval.status === 'APPROVED' ? '✓' : '4'}
                    </div>
                    <span className="text-slate-300 font-bold block">PO Generated</span>
                    <span className="text-[8px] text-slate-500">
                      {selectedApproval.status === 'APPROVED' ? 'ISSUED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* DECISION FEEDBACK ALERT */}
              {successMsg && (
                <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/25 text-emerald-400 text-xs font-mono shadow-md">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* REQUESTED BID DETAILS SUMMARY */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-violet-500/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Requested Quotation Vendor</span>
                  <span className="text-cyan-400 font-bold text-sm block mt-0.5">{pkg.quote?.vendor?.name}</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 font-bold">{pkg.quote?.vendor?.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between md:items-end">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Total Bid Value</span>
                    <span className="text-white font-extrabold text-base block mt-0.5">
                      {pkg.quote ? formatCurrency(pkg.quote.total_amount) : 'N/A'}
                    </span>
                  </div>
                  <div className="text-right mt-1.5 text-slate-400 text-[10px]">
                    Delivery: <span className="text-amber-300 font-bold">{pkg.quote?.delivery_days} Light-Days</span>
                  </div>
                </div>
                <div className="md:col-span-2 border-t border-violet-500/5 pt-2">
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Vendor Note</span>
                  <p className="text-slate-400 italic text-[11px] mt-0.5">"{pkg.quote?.notes || 'No remarks provided.'}"</p>
                </div>
              </div>

              {/* SIDE-BY-SIDE VERIFICATION MATRIX */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Verify pricing against alternatives
                </span>

                <div className="overflow-x-auto rounded-xl border border-violet-500/10 bg-slate-950/40">
                  <table className="w-full text-left border-collapse text-xs font-mono min-w-[500px]">
                    <thead>
                      <tr className="border-b border-violet-500/10 bg-slate-900/40 text-slate-400">
                        <th className="p-3">Line Item</th>
                        {pkg.allQuotes.map((q) => {
                          const isSelectedQuote = q.id === selectedApproval.quotation_id;
                          return (
                            <th key={q.id} className={`p-3 text-center border-l border-violet-500/10 ${
                              isSelectedQuote ? 'bg-cyan-500/10 text-cyan-400' : ''
                            }`}>
                              <span className="block truncate max-w-[120px] mx-auto">{q.vendor?.name}</span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-500/5">
                      {pkg.rfq?.items?.map((item) => {
                        const lowestItemPrice = getLowestUnitPriceForItem(item.id, pkg.allQuotes);

                        return (
                          <tr key={item.id} className="hover:bg-slate-900/10 text-slate-300">
                            <td className="p-3">
                              <span className="font-semibold text-slate-200">{item.product_name}</span>
                              <span className="block text-[10px] text-slate-500">Req: {item.quantity}</span>
                            </td>
                            {pkg.allQuotes.map((q) => {
                              const itemQuote = q.items.find(i => i.rfq_item_id === item.id);
                              const unitPrice = itemQuote?.unit_price || 0;
                              const isLowest = unitPrice === lowestItemPrice && lowestItemPrice > 0;
                              const isSelectedQuote = q.id === selectedApproval.quotation_id;

                              return (
                                <td 
                                  key={q.id} 
                                  className={`p-3 text-center border-l border-violet-500/10 ${
                                    isSelectedQuote ? 'bg-cyan-500/5' : ''
                                  } ${isLowest ? 'text-emerald-300 font-semibold' : ''}`}
                                >
                                  <div>{formatCurrency(unitPrice)}</div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                      {/* Totals Comparison row */}
                      <tr className="bg-slate-900/20 font-bold border-t border-violet-500/10">
                        <td className="p-3 uppercase tracking-wider text-[9px] text-slate-500">Gross Total Bid</td>
                        {pkg.allQuotes.map((q) => {
                          const isSelectedQuote = q.id === selectedApproval.quotation_id;
                          return (
                            <td 
                              key={q.id} 
                              className={`p-3 text-center border-l border-violet-500/10 text-sm ${
                                isSelectedQuote ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
                              }`}
                            >
                              {formatCurrency(q.total_amount)}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ACTION DECK */}
              <div className="border-t border-violet-500/10 pt-5 space-y-4">
                {selectedApproval.status === 'PENDING' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono tracking-wider text-cyan-400 uppercase mb-2">
                        Written Remarks & Authorizing Comments
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 font-sans h-20 placeholder-slate-600"
                        placeholder="Log instructions, specifications, delivery approvals, or rejection rationale..."
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-4">
                      <button
                        onClick={() => handleResolveApproval('REJECTED')}
                        disabled={submitting}
                        className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-mono font-bold bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject Contract</span>
                      </button>
                      <button
                        onClick={() => handleResolveApproval('APPROVED')}
                        disabled={submitting}
                        className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-mono font-bold cosmic-btn-primary shadow-glow-cyan"
                      >
                        <Check className="w-4 h-4" />
                        <span>Authorize Contract</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-violet-500/5 text-center text-xs font-mono text-slate-400">
                    <p>
                      This requisition package was resolved by Manager on {formatDate(selectedApproval.resolved_at)}.
                    </p>
                    {selectedApproval.remarks && (
                      <p className="text-slate-500 italic mt-1.5">
                        Remarks logged: "{selectedApproval.remarks}"
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-xl p-16 text-center border border-violet-500/10 flex flex-col items-center justify-center h-80">
              <Clock className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
              <h4 className="font-outfit font-bold text-slate-400 text-sm">Select Requisition Package</h4>
              <p className="text-slate-500 text-xs mt-1 font-mono">
                Click any pending uplink request from the queue to verify vendor grids.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Approvals;
