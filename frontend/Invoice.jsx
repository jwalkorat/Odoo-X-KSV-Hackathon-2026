import React, { useState } from 'react';
import Navigation from './Navigation';

const Invoice = () => {
  // MOCK DATA: Simulating the approved order converted into an invoice
  const [invoiceData] = useState({
    invoiceNumber: "INV-GLX-9934",
    poReference: "PO-GLX-2026-001",
    issueDate: new Date().toLocaleDateString(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString(),
    vendor: {
      name: "Nebula Tech Supplies",
      address: "Sector 4, Orion Cygnus Arm, Milky Way",
      email: "billing@nebulatech.space"
    },
    company: {
      name: "Procurement Galaxy HQ",
      address: "Central Node, Alpha Centauri Prime",
      email: "accounts@procurementgalaxy.com"
    },
    items: [
      { id: 1, name: "Quantum Processors (Q-Core)", qty: 50, price: 1200 },
      { id: 2, name: "Plasma Display Panels", qty: 200, price: 450 },
      { id: 3, name: "Hyperdrive Sync Cables", qty: 1000, price: 15 }
    ]
  });

  // Math calculations
  const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const taxRate = 0.05; // 5% Tax
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    // Outer Wrapper with Navigation
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 font-sans print:bg-white">
      <Navigation active="invoices" />
      
      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-12 print:p-0">
      
      {/* Top Action Bar (Hides when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button className="text-indigo-300 hover:text-white transition-colors">
          ← Back to Dashboard
        </button>
        <button 
          onClick={handlePrint}
          className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Print Invoice
        </button>
      </div>

      {/* The A4 Document Area */}
      <div className="max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none print:bg-white print:text-black">
        
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-indigo-500/30 print:border-gray-300 flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wider print:text-black print:bg-none">
              INVOICE
            </h1>
            <p className="text-indigo-300/70 mt-2 print:text-gray-600">{invoiceData.company.name}</p>
            <p className="text-sm text-indigo-300/50 print:text-gray-500">{invoiceData.company.address}</p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-2xl font-mono text-white print:text-black">
              {invoiceData.invoiceNumber}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-indigo-300/70 print:text-gray-600">Issue Date:</span>
              <span className="text-white print:text-black">{invoiceData.issueDate}</span>
              <span className="text-indigo-300/70 print:text-gray-600">Due Date:</span>
              <span className="text-white font-semibold print:text-black">{invoiceData.dueDate}</span>
              <span className="text-indigo-300/70 print:text-gray-600">PO Ref:</span>
              <span className="text-indigo-200 print:text-gray-800">{invoiceData.poReference}</span>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="p-8 md:px-12 bg-slate-800/20 print:bg-transparent">
          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3 print:text-gray-500">Billed To</h3>
          <p className="font-bold text-lg text-white print:text-black">{invoiceData.vendor.name}</p>
          <p className="text-indigo-200/80 text-sm mt-1 print:text-gray-700">{invoiceData.vendor.address}</p>
          <p className="text-indigo-200/80 text-sm print:text-gray-700">{invoiceData.vendor.email}</p>
        </div>

        {/* Line Items */}
        <div className="px-8 md:px-12 py-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-indigo-500/50 print:border-gray-800 text-indigo-300 print:text-black text-sm uppercase tracking-wider">
                <th className="py-4 font-bold">Description</th>
                <th className="py-4 font-bold text-center">Qty</th>
                <th className="py-4 font-bold text-right">Unit Price</th>
                <th className="py-4 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/20 print:divide-gray-300">
              {invoiceData.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 font-medium text-indigo-100 print:text-gray-800">{item.name}</td>
                  <td className="py-4 text-center text-indigo-200 print:text-gray-700">{item.qty}</td>
                  <td className="py-4 text-right text-indigo-200 print:text-gray-700">₹{item.price.toLocaleString()}</td>
                  <td className="py-4 text-right font-mono text-white print:text-black">₹{(item.qty * item.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="p-8 md:p-12 bg-slate-900/90 print:bg-transparent flex flex-col items-end border-t border-indigo-500/30 print:border-gray-800">
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-indigo-200 print:text-gray-700 text-sm">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-indigo-200 print:text-gray-700 text-sm">
              <span>Tax (5%):</span>
              <span className="font-mono">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-white print:text-black border-t-2 border-indigo-500/50 print:border-gray-800 pt-4 mt-4">
              <span>Total Due:</span>
              <span className="font-mono">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-8 py-6 md:px-12 text-center text-xs text-indigo-400/50 print:text-gray-400 border-t border-indigo-500/10 print:border-none">
          Thank you for doing business across the stars. Payment is due within 30 standard galactic cycles.
        </div>

      </div>

      </div>
    </div>
  );
};

export default Invoice;
