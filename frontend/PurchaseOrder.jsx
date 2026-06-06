import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';

const PurchaseOrder = () => {
  // 1. MOCK DATA: Replace this with real data from Supabase once P3 finishes the approval flow.
  const [poData, setPoData] = useState({
    poNumber: "PO-GLX-2026-001", // Auto-generated PO Number
    status: "Approved",
    date: new Date().toLocaleDateString(),
    vendor: {
      name: "Nebula Tech Supplies",
      email: "billing@nebulatech.space",
      address: "Sector 4, Orion Cygnus Arm, Milky Way",
      contact: "+1 (555) 890-1234"
    },
    items: [
      { id: 1, name: "Quantum Processors (Q-Core)", qty: 50, price: 1200 },
      { id: 2, name: "Plasma Display Panels", qty: 200, price: 450 },
      { id: 3, name: "Hyperdrive Sync Cables", qty: 1000, price: 15 }
    ]
  });

  // Calculate totals
  const subtotal = poData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const tax = subtotal * 0.05; // 5% Intergalactic Trade Tax
  const grandTotal = subtotal + tax;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-indigo-100 font-sans">
      <Navigation active="purchase-orders" />
      
      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-12">
      
      {/* Container Card with Glassmorphism */}
      <div className="max-w-5xl mx-auto bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.15)] overflow-hidden">
        
        {/* Header Section */}
        <div className="p-8 border-b border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wider">
              PURCHASE ORDER
            </h1>
            <p className="text-indigo-300/70 mt-1">Procurement Galaxy ERP</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-white bg-indigo-950/50 px-4 py-2 rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              {poData.poNumber}
            </div>
            <p className="text-sm text-indigo-300/70 mt-2">Date: {poData.date}</p>
          </div>
        </div>

        {/* Vendor & Shipping Info */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-800/40 p-5 rounded-xl border border-indigo-500/20">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Vendor Details</h3>
            <p className="font-bold text-lg text-white">{poData.vendor.name}</p>
            <p className="text-indigo-200/80 text-sm mt-1">{poData.vendor.address}</p>
            <p className="text-indigo-200/80 text-sm">{poData.vendor.email}</p>
            <p className="text-indigo-200/80 text-sm">{poData.vendor.contact}</p>
          </div>
          
          <div className="bg-slate-800/40 p-5 rounded-xl border border-indigo-500/20 flex flex-col justify-center">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Order Status</h3>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium tracking-wide uppercase">{poData.status}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="px-8 pb-8 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-indigo-900/40 border-b border-indigo-500/40 text-indigo-300 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Item Description</th>
                <th className="p-4 font-medium text-center">Qty</th>
                <th className="p-4 font-medium text-right">Unit Price</th>
                <th className="p-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/20">
              {poData.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-medium text-indigo-100">{item.name}</td>
                  <td className="p-4 text-center text-indigo-200">{item.qty}</td>
                  <td className="p-4 text-right text-indigo-200">₹{item.price.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-white">₹{(item.qty * item.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="p-8 bg-slate-900/80 border-t border-indigo-500/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-indigo-300/60 max-w-sm">
            * This is an official system-generated Purchase Order. Terms and conditions of the Procurement Galaxy apply.
          </p>
          
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-indigo-200 text-sm">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-indigo-200 text-sm">
              <span>Trade Tax (5%):</span>
              <span className="font-mono">₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-white border-t border-indigo-500/40 pt-3 mt-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Grand Total:</span>
              <span className="font-mono">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-950/50 flex justify-end gap-4 border-t border-indigo-500/30">
          <button className="px-6 py-2 rounded-lg text-sm font-medium text-indigo-300 hover:text-white hover:bg-slate-800 transition-all border border-transparent hover:border-indigo-500/30">
            Cancel
          </button>
          <button className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all">
            Proceed to Invoice →
          </button>
        </div>

      </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;