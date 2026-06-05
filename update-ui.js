const fs = require('fs');

const profileFile = 'apps/web/src/app/dashboard/profile/page.tsx';
let code = fs.readFileSync(profileFile, 'utf8');

// 1. Add imports
code = code.replace(
  'import { CategoryMultiSelect } from "@/components/ui/CategoryMultiSelect";',
  \`import { CategoryMultiSelect } from "@/components/ui/CategoryMultiSelect";
import { AddProfessionalForm } from "../../../components/forms/AddProfessionalForm";
import { saveOwnerVerificationData } from "@/app/actions/salon-operations";
import { Plus, Users, Globe } from "lucide-react";\`
);

// 2. Add states
const statesSearch = 'const [salonAmenities, setSalonAmenities] = useState<Record<string, { has_amenity: boolean, quantity: number | null }>>({});';
code = code.replace(
  statesSearch,
  \`\${statesSearch}
  
  // Extra states for Field Editor integration
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [globalStaffRoles, setGlobalStaffRoles] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<{[key: string]: { enabled: boolean, price: string, duration: string, category: string }}>({});
  const [staffToAdd, setStaffToAdd] = useState<any[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  \`
);

// 3. Add fetch logic
const fetchSearch = 'setSalonAmenities(amenitiesMap);\\n      }';
code = code.replace(
  fetchSearch,
  \`\${fetchSearch}

      // 4. Fetch Extra Agent Data
      const res = result as any;
      if (res.globalServices) setGlobalServices(res.globalServices);
      if (res.globalStaffRoles) setGlobalStaffRoles(res.globalStaffRoles);
      
      if (res.services) {
        const svcMap: any = {};
        for (const s of res.services) {
          svcMap[s.global_service_id] = {
            enabled: true,
            price: s.price?.toString() || "0",
            duration: s.duration_min?.toString() || "30",
            category: s.category || "",
          };
        }
        setSelectedServices(svcMap);
      }
      if (res.staff) setStaffToAdd(res.staff);
      \`
);

// 4. Replace handleSave
const saveSearchStart = 'const handleSave = async () => {';
const saveSearchEnd = 'const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {';
const oldSave = code.substring(code.indexOf(saveSearchStart), code.indexOf(saveSearchEnd));

const newSave = \`const handleSave = async () => {
    try {
      setSaving(true);
      
      const svcsToAdd = [];
      const svcsToRemoveIds: string[] = []; // We will insert all
      for (const [id, config] of Object.entries(selectedServices)) {
        if (config.enabled) {
          const gs = globalServices.find((g:any) => g.id === id);
          if (gs) {
            svcsToAdd.push({
              global_service_id: id,
              name: gs.name,
              category: config.category,
              category_id: gs.category_id,
              price: parseFloat(config.price) || 0,
              duration_min: parseInt(config.duration) || gs.default_duration || 30,
              status: "active"
            });
          }
        }
      }

      const payload = {
        name,
        slug,
        phone: contact,
        address: address,
        province,
        district,
        description,
        price_level: parseInt(priceLevel) || null,
        latitude: parseFloat(latitude) || null,
        longitude: parseFloat(longitude) || null,
        rating: parseFloat(rating) || null,
        working_hours: salonSchedule,
        category: selectedCategories.join(", "),
      };

      const result = await saveOwnerVerificationData(
        payload,
        { svcsToAdd, svcsToRemoveIds },
        staffToAdd,
        salonAmenities
      );

      if (!result.success) throw new Error(result.error);
      
      toast.success("Salon Profile sent for verification successfully!");
      setOnboardingStatus("OWNER_ACTIVATED");
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  \`;
code = code.replace(oldSave, newSave);

// 5. Inject JSX before the bottom Action Bar
const jsxSearch = '{/* Floating Action Bar */}';
const newJSX = \`
            {/* Section 4: Included Services */}
            <Card className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">Included Services</h3>
                  <p className="text-sm text-zinc-500 font-medium">Verify the services provided</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {globalServices.filter(s => selectedCategories.includes(s.category)).map(s => {
                    const config = selectedServices[s.id] || { enabled: false, price: s.default_price?.toString() || "0", duration: s.default_duration?.toString() || "30", category: s.category || "" };
                    return (
                      <div 
                        key={s.id}
                        className={\`p-4 rounded-2xl border transition-colors \${
                          config.enabled ? 'bg-white border-emerald-200 shadow-sm' : 'bg-white border-zinc-200 opacity-70 hover:opacity-100'
                        }\`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer mb-3">
                          <input 
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, enabled: e.target.checked } }))}
                            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                          />
                          <span className="text-sm font-bold text-zinc-800">{s.name} <span className="text-zinc-400 font-normal">({s.category})</span></span>
                        </label>
                        {config.enabled && (
                          <div className="flex gap-3 pl-8 mt-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Price</label>
                              <Input 
                                type="number" 
                                value={config.price} 
                                onChange={e => setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, price: e.target.value } }))}
                                className="h-10 text-sm border-zinc-200 focus:border-emerald-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Duration (m)</label>
                              <Input 
                                type="number" 
                                value={config.duration} 
                                onChange={e => setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, duration: e.target.value } }))}
                                className="h-10 text-sm border-zinc-200 focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                 })}
              </div>
            </Card>

            {/* Section 5: Salon Staff */}
            <Card className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">Salon Staff</h3>
                    <p className="text-sm text-zinc-500 font-medium">Verify the added professionals</p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsStaffModalOpen(true)}
                  className="border-dashed border-2 border-zinc-200 text-zinc-500 font-bold hover:bg-zinc-50 hover:border-zinc-300"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Staff
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffToAdd.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-sm uppercase">
                        {st.name.substring(0,2)}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-zinc-900">{st.name}</h5>
                        <p className="text-xs text-zinc-500 font-medium">{st.role}</p>
                      </div>
                    </div>
                    <button onClick={() => setStaffToAdd(prev => prev.filter((_, i) => i !== idx))} className="text-zinc-400 hover:text-red-500 p-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {staffToAdd.length === 0 && (
                  <p className="text-sm text-zinc-400 italic py-4">No staff added yet.</p>
                )}
              </div>
            </Card>
            
            {isStaffModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto py-10">
                <AddProfessionalForm
                  onCancel={() => setIsStaffModalOpen(false)}
                  onSubmit={(staffData) => {
                    setStaffToAdd(prev => [...prev, staffData]);
                    setIsStaffModalOpen(false);
                  }}
                  globalRoles={globalStaffRoles}
                  salonServices={Object.keys(selectedServices).filter(id => selectedServices[id].enabled).map(id => {
                    const gs = globalServices.find(g => g.id === id);
                    return {
                      id,
                      name: gs?.name || "",
                      category: gs?.category || ""
                    };
                  })}
                />
              </div>
            )}
            
            \${jsxSearch}\`;

code = code.replace(jsxSearch, newJSX);

fs.writeFileSync(profileFile, code);
console.log("Updated successfully!");
