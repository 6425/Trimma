import React from "react";
import { Loader2, Save, X, Sparkles, Store, UploadCloud, Target, MapPin, Scissors, Trash2, User, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { Badge } from "@/components/ui/badge";
import { WorkingHoursEditor } from "./WorkingHoursEditor";
import { Image as ImageIcon } from "lucide-react";

interface LeadEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: any;
  formData: any;
  setFormData: (data: any) => void;
  updating: boolean;
  onSave: () => void;
  handleModalImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: "hero_url" | "logo_url") => void;
  discoveryCategories: {value: string, label: string}[];
  agents: any[];
  
  modalServices: any[];
  modalStaff: any[];
  handleDeleteModalService: (id: string) => void;
  handleDeleteModalStaff: (id: string) => void;
  
  editingStaffId: string | null;
  setEditingStaffId: (id: string | null) => void;
  staffEditData: any;
  setStaffEditData: (data: any) => void;
  globalRoles: any[];
  handleSaveModalStaff: () => void;
  handleEditModalStaff: (staff: any) => void;
}

export function LeadEditorModal({
  isOpen, onClose, selectedLead, formData, setFormData, updating, onSave,
  handleModalImageUpload, discoveryCategories, agents,
  modalServices, modalStaff, handleDeleteModalService, handleDeleteModalStaff,
  editingStaffId, setEditingStaffId, staffEditData, setStaffEditData,
  globalRoles, handleSaveModalStaff, handleEditModalStaff
}: LeadEditorModalProps) {
  
  if (!isOpen || !selectedLead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-[2rem] max-w-7xl w-full shadow-2xl relative border border-zinc-200 flex flex-col h-[90vh] md:h-full max-h-[96vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 bg-white z-10 shadow-sm">
          <div>
            <h3 className="text-2xl font-black text-[#1A1C29] tracking-tight">Salon Profile Studio — Admin</h3>
            <p className="text-sm text-zinc-500 mt-1 font-medium">Lead ID: {formData.id} <span className="text-zinc-700 mx-2">|</span> Created: {new Date(selectedLead.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="rounded-xl font-bold h-11 border-zinc-200 text-zinc-500 hover:bg-slate-50 text-sm px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={onSave}
              disabled={updating}
              className="bg-brand hover:bg-[#b01849] text-zinc-900 rounded-xl font-bold h-11 px-8 shadow-md shadow-brand/20 flex items-center gap-2 text-sm transition-all"
            >
              {updating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Profile</>
              )}
            </Button>
            <button 
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable Dashboard Layout) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column (Main Forms) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* VISUAL ASSET MANAGER */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand" />
                  Visual Asset Manager
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Hero Cover Image URL</label>
                    <div className="h-32 w-full rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative group">
                      {formData.hero_url ? (
                        <img src={formData.hero_url} alt="Hero" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        value={formData.hero_url || ""}
                        onChange={(e) => setFormData({...formData, hero_url: e.target.value})}
                        placeholder="https://..."
                        className="h-11 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 flex-1"
                      />
                      <div className="relative">
                        <Button variant="outline" type="button" className="h-11 rounded-xl border-zinc-200 px-3 hover:bg-zinc-100 relative overflow-hidden">
                          <UploadCloud className="w-4 h-4 text-zinc-500" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleModalImageUpload(e, "hero_url")}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Logo Image URL</label>
                    <div className="h-32 w-32 rounded-full mx-auto bg-zinc-50 border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative group">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-8 h-8 text-zinc-700" />
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        value={formData.logo_url || ""}
                        onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                        placeholder="https://..."
                        className="h-11 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 flex-1"
                      />
                      <div className="relative">
                        <Button variant="outline" type="button" className="h-11 rounded-xl border-zinc-200 px-3 hover:bg-zinc-100 relative overflow-hidden">
                          <UploadCloud className="w-4 h-4 text-zinc-500" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleModalImageUpload(e, "logo_url")}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CORE BUSINESS IDENTITY */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand" />
                  Core Business Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Salon Name</label>
                    <Input 
                      value={formData.name || ""}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Category</label>
                    <select
                      value={formData.category || ""}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full h-12 px-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm font-medium text-zinc-800 shadow-sm"
                    >
                      <option value="">Select Category...</option>
                      {discoveryCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Owner Gmail</label>
                    <Input 
                      value={formData.owner_gmail || ""}
                      onChange={(e) => setFormData({...formData, owner_gmail: e.target.value})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Rating</label>
                      <Input 
                        type="number" step="0.01"
                        value={formData.rating || ""}
                        onChange={(e) => setFormData({...formData, rating: e.target.value})}
                        className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Price Lvl</label>
                      <Input 
                        value={formData.price_level || ""}
                        onChange={(e) => setFormData({...formData, price_level: e.target.value})}
                        className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Google Place ID</label>
                    <Input 
                      value={formData.place_id || ""}
                      onChange={(e) => setFormData({...formData, place_id: e.target.value})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[11px] focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
              </div>

              {/* CONTACT & GEO */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand" />
                  Location & Contact Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Phone Number</label>
                    <LkPhoneInput
                      value={formData.phone || ""}
                      onChange={(phone) => setFormData({...formData, phone})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Website</label>
                    <Input 
                      value={formData.website || ""}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Full Address</label>
                    <Input 
                      value={formData.address || ""}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Google Maps URL</label>
                    <Input 
                      value={formData.map_url || ""}
                      onChange={(e) => setFormData({...formData, map_url: e.target.value})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium text-brand"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Latitude</label>
                    <Input 
                      type="number" step="any"
                      value={formData.latitude || ""}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[11px] focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Longitude</label>
                    <Input 
                      type="number" step="any"
                      value={formData.longitude || ""}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      className="h-12 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[11px] focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
              </div>

              {/* PROVISIONED SERVICES LIBRARY */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-brand" />
                  Provisioned Services Library
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-zinc-100">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-4 rounded-tl-2xl">Service Name</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Duration</th>
                        <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 text-zinc-700 font-medium">
                      {modalServices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 font-normal">
                            No services provisioned yet.
                          </td>
                        </tr>
                      ) : (
                        modalServices.map(service => (
                          <tr key={service.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4">{service.name}</td>
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-bold">{service.category}</Badge>
                            </td>
                            <td className="px-6 py-4">LKR {service.price}</td>
                            <td className="px-6 py-4 text-zinc-500">{service.duration_min} min</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeleteModalService(service.id)} className="text-zinc-500 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PROVISIONED SALON STAFF */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-brand" />
                  Provisioned Salon Staff
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-zinc-100">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-4 rounded-tl-2xl">Staff Name</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 text-zinc-700 font-medium">
                      {modalStaff.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 font-normal">
                            No staff members provisioned yet.
                          </td>
                        </tr>
                      ) : (
                        modalStaff.map(staff => (
                          <tr key={staff.id} className="hover:bg-zinc-50/50 transition-colors">
                            {editingStaffId === staff.id ? (
                              <>
                                <td className="px-6 py-4">
                                  <input 
                                    type="text" 
                                    className="w-full text-sm border-zinc-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-brand"
                                    value={staffEditData.name || ''} 
                                    onChange={e => setStaffEditData({...staffEditData, name: e.target.value})} 
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <select 
                                    className="w-full text-sm border-zinc-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-brand capitalize bg-white"
                                    value={staffEditData.role || ''}
                                    onChange={e => setStaffEditData({...staffEditData, role: e.target.value})}
                                  >
                                    <optgroup label="Operational">
                                      {globalRoles.filter(r => r.category === 'Operational').map(r => (
                                        <option key={r.role_name} value={r.role_name}>{r.role_name}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Admin">
                                      {globalRoles.filter(r => r.category === 'Admin').map(r => (
                                        <option key={r.role_name} value={r.role_name}>{r.role_name}</option>
                                      ))}
                                    </optgroup>
                                  </select>
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                  <button onClick={handleSaveModalStaff} className="text-brand hover:text-brand-hover p-2 rounded-xl hover:bg-brand/10 transition-colors">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingStaffId(null)} className="text-zinc-500 hover:text-zinc-600 p-2 rounded-xl hover:bg-zinc-100 transition-colors">
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-4 font-bold text-zinc-900">{staff.name}</td>
                                <td className="px-6 py-4 capitalize">{staff.role}</td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                                  <button onClick={() => handleEditModalStaff(staff)} className="text-zinc-500 hover:text-brand p-2 rounded-xl hover:bg-brand/10 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteModalStaff(staff.id)} className="text-zinc-500 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column (Sidebar Workflow) */}
            <div className="space-y-8">
              
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Pipeline & Assignment
                </h3>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Onboarding Status</label>
                    <select
                      value={formData.onboarding_status || "DISCOVERED"}
                      onChange={(e) => setFormData({...formData, onboarding_status: e.target.value})}
                      className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm font-black text-zinc-800"
                    >
                      <option value="DISCOVERED">DISCOVERED</option>
                      <option value="AUTO_PROVISIONED">AUTO_PROVISIONED</option>
                      <option value="ASSIGNED_TO_AGENT">ASSIGNED_TO_AGENT</option>
                      <option value="AGENT_VERIFIED">AGENT_VERIFIED</option>
                      <option value="OWNER_INVITED">OWNER_INVITED</option>
                      <option value="OWNER_ACTIVATED">OWNER_ACTIVATED</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Assign to Agent</label>
                    <select
                      value={formData.assign_to || ""}
                      onChange={(e) => setFormData({...formData, assign_to: e.target.value})}
                      className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm font-semibold text-zinc-800"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((agent) => (
                        <option key={agent.email} value={agent.email}>
                          {agent.full_name || agent.email} ({agent.global_role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide text-amber-600">Admin Notes for Agent</label>
                    <textarea
                      value={formData.admin_notes || ""}
                      onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                      placeholder="e.g. Visit on weekday morning..."
                      className="w-full min-h-[100px] p-4 rounded-xl bg-amber-50 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-semibold leading-relaxed text-amber-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  AI & Tech Details
                </h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">AI Summary / Description</label>
                    <textarea
                      value={formData.summary || ""}
                      onChange={(e) => setFormData({...formData, summary: e.target.value})}
                      className="w-full min-h-[120px] p-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/20 text-xs font-medium leading-relaxed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Opening Hours</label>
                    <WorkingHoursEditor 
                      value={formData.working_hours || "[]"} 
                      onChange={(val) => setFormData({...formData, working_hours: val})} 
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
