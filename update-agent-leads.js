const fs = require('fs');
const file = 'apps/web/src/app/agent/leads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Change title
code = code.replace(
  '<h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">Field Verification Editor</h1>',
  '<h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">Salon Creation</h1>'
);

// 2. Change tab names
code = code.replace(
  'Verified ({leads.filter(l => l.onboarding_status === "AGENT_VERIFIED").length})',
  'Published ({leads.filter(l => l.onboarding_status === "PUBLISHED_UNBOOKABLE").length})'
);
code = code.replace(
  'const tabLeads = leads.filter(l => {',
  \`const tabLeads = leads.filter(l => {\`
);
code = code.replace(
  \`if (activeTab === "verified") return l.onboarding_status === "AGENT_VERIFIED";\`,
  \`if (activeTab === "verified") return l.onboarding_status === "PUBLISHED_UNBOOKABLE";\`
);
code = code.replace(
  '["AGENT_VERIFIED","OWNER_INVITED","OWNER_ACTIVATED","AGENT_APPROVED","VERIFIED"].includes(l.onboarding_status)',
  '["PUBLISHED_UNBOOKABLE","OWNER_INVITED","OWNER_ACTIVATED","PENDING_ADMIN_VERIFICATION","VERIFIED"].includes(l.onboarding_status)'
);
code = code.replace(
  '["OWNER_INVITED","OWNER_ACTIVATED","AGENT_APPROVED","VERIFIED"].includes(l.onboarding_status)',
  '["OWNER_INVITED","OWNER_ACTIVATED","PENDING_ADMIN_VERIFICATION","VERIFIED"].includes(l.onboarding_status)'
);
code = code.replace(
  '["OWNER_INVITED","OWNER_ACTIVATED","AGENT_APPROVED","VERIFIED"].includes(l.onboarding_status)',
  '["OWNER_INVITED","OWNER_ACTIVATED","PENDING_ADMIN_VERIFICATION","VERIFIED"].includes(l.onboarding_status)'
);

// 3. Handlers
const handleVerifStart = 'const handleVerification = async () => {';
const handleAgentApprovStart = 'const handleAgentApproval = async () => {';
const oldHandlers = code.substring(code.indexOf(handleVerifStart), code.indexOf(handleAgentApprovStart));

const newHandlers = \`
  const handlePublish = async () => {
    if (!selectedLead) return;
    try {
      setUpdating(true);
      
      const updatePayload: any = {
        name: formData.name,
        category: formData.category,
        address: formData.address,
        phone: formData.phone,
        owner_email: formData.owner_gmail,
        website: formData.website,
        rating: parseFloat(formData.rating) || null,
        hero_url: formData.hero_url,
        price_level: parseInt(formData.price_level) || null,
        google_summary: formData.google_summary,
        agent_notes: formData.agent_notes,
        working_hours: formData.working_hours,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
        map_url: formData.map_url,
        map_embed_url: formData.map_embed_url,
        onboarding_status: "PUBLISHED_UNBOOKABLE",
        public_visibility: true,
        booking_enabled: false,
        status: "active"
      };

      const { servicesData, staffToAdd: finalStaffToAdd } = await prepareServicesAndStaff(selectedLead.id);
      
      const { success, error } = await saveAgentLeadData(
        selectedLead.id,
        updatePayload,
        servicesData,
        finalStaffToAdd,
        agentEmail,
        "PUBLISHED_UNBOOKABLE",
        salonAmenities
      );
      if (!success) throw new Error(error || "Failed to save via Server Action");

      toast.success("Salon published successfully (Booking disabled).");
      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!selectedLead) return;
    if (!formData.owner_gmail) {
      toast.error("Owner Gmail is required to send an invitation.");
      return;
    }
    
    try {
      setUpdating(true);
      
      const updatePayload: any = {
        onboarding_status: "OWNER_INVITED",
      };

      const { success, error } = await saveAgentLeadData(
        selectedLead.id,
        updatePayload,
        null,
        null,
        agentEmail,
        "OWNER_INVITED",
        salonAmenities
      );
      if (!success) throw new Error(error || "Failed to update status");

      const res = await fetch("/api/invite-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: selectedLead.id,
          ownerEmail: formData.owner_gmail,
          actorEmail: agentEmail,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send email invite");
      }

      if (formData.phone) {
        const waRes = await sendOnboardingInviteAlert(
          selectedLead.id, 
          formData.phone, 
          formData.owner_gmail, 
          formData.name || selectedLead.name,
          selectedLead.slug
        );
        if (!waRes.success) {
          console.warn("WhatsApp notification failed:", waRes.error);
        }
      }
      
      toast.success("Invites sent to owner!");
      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

\`;
code = code.replace(oldHandlers, newHandlers);

const agentApprovOldStart = code.indexOf(handleAgentApprovStart);
const getAgentApprovEnd = code.indexOf('const getStatusColor', agentApprovOldStart);
const oldAgentApprov = code.substring(agentApprovOldStart, getAgentApprovEnd);

const newAgentApprov = \`const handleAgentApproval = async () => {
    if (!selectedLead) return;
    try {
      setUpdating(true);
      
      const updatePayload: any = {
        onboarding_status: "PENDING_ADMIN_VERIFICATION",
        booking_enabled: true
      };

      const { success, error } = await saveAgentLeadData(
        selectedLead.id,
        updatePayload,
        null,
        null,
        agentEmail,
        "PENDING_ADMIN_VERIFICATION",
        salonAmenities
      );
      if (!success) throw new Error(error || "Failed to save via Server Action");

      if (formData.phone) {
        const waRes = await sendAgentApprovalAlerts(
          selectedLead.id,
          formData.phone,
          formData.name || selectedLead.name
        );
        if (!waRes.success) {
          console.warn("WhatsApp agent approval alert failed:", waRes.error);
        }
      }
      
      toast.success("Salon approved and sent to Admin for Verification! (Booking enabled)");
      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  \`;
code = code.replace(oldAgentApprov, newAgentApprov);


// 4. Buttons in the Modal
const buttonsSearch = \`                  {["ASSIGNED_TO_AGENT", "DISCOVERED"].includes(formData.onboarding_status) && (
                    <Button
                      onClick={handleVerification}
                      disabled={updating || !formData.phone || !formData.owner_gmail}
                      className="bg-brand hover:bg-emerald-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save & Request Owner Setup
                    </Button>
                  )}

                  {formData.onboarding_status === "OWNER_ACTIVATED" && (
                    <Button
                      onClick={handleAgentApproval}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Go Live
                    </Button>
                  )}\`;
                  
const newButtons = \`                  {["ASSIGNED_TO_AGENT", "DISCOVERED"].includes(formData.onboarding_status) && (
                    <Button
                      onClick={handlePublish}
                      disabled={updating}
                      className="bg-zinc-800 hover:bg-black text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save & Publish
                    </Button>
                  )}
                  
                  {["PUBLISHED_UNBOOKABLE"].includes(formData.onboarding_status) && (
                    <Button
                      onClick={handleSendInvitation}
                      disabled={updating || !formData.phone || !formData.owner_gmail}
                      className="bg-brand hover:bg-emerald-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Send Invitation
                    </Button>
                  )}

                  {formData.onboarding_status === "OWNER_ACTIVATED" && (
                    <Button
                      onClick={handleAgentApproval}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Enable Booking & Send to Admin
                    </Button>
                  )}\`;
code = code.replace(buttonsSearch, newButtons);

// Handle Badge replacements
code = code.replace(
  '["AGENT_APPROVED", "VERIFIED"].includes(formData.onboarding_status)',
  '["PENDING_ADMIN_VERIFICATION", "VERIFIED"].includes(formData.onboarding_status)'
);
code = code.replace(
  '✅ Salon Live',
  '✅ Booking Enabled'
);

fs.writeFileSync(file, code);
console.log("Updated agent leads page successfully!");
