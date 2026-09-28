import { useEffect, useState } from "react";
import adminApi from "../../lib/adminApi";

const tabs = ["Inbox", "Certificate Requests", "Enquiries"];

export default function OperationsInbox() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [inbox, setInbox] = useState([]);
  const [certificateRequests, setCertificateRequests] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const [inboxResult, unreadResult, requestResult, enquiryResult] = await Promise.all([
        adminApi.listInbox(),
        adminApi.getInboxUnreadCount(),
        adminApi.listCertificateRequests(),
        adminApi.listEnquiries(),
      ]);
      setInbox(inboxResult.data);
      setUnread(unreadResult.data.unread);
      setCertificateRequests(requestResult.data);
      setEnquiries(enquiryResult.data);
    } catch (requestError) {
      setError(requestError.message || "Unable to load operations inbox.");
    }
  };

  useEffect(() => { loadData(); }, []);

  const acknowledge = async (item) => {
    setError("");
    try {
      await adminApi.acknowledgeInboxItem(item.id);
      setInbox((current) => current.map((entry) => entry.id === item.id ? { ...entry, ackAt: new Date().toISOString() } : entry));
      setUnread((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(requestError.message || "Unable to acknowledge this item.");
    }
  };

  const rejectCertificate = async (item) => {
    const note = window.prompt("Reason for rejecting this certificate request:");
    if (!note?.trim()) return;
    setError("");
    try {
      await adminApi.decideCertificateRequest(item.id, "rejected", note.trim());
      setCertificateRequests((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "rejected" } : entry));
    } catch (requestError) {
      setError(requestError.message || "Unable to decide this request.");
    }
  };

  const closeEnquiry = async (item) => {
    setError("");
    try {
      const result = await adminApi.updateEnquiry(item.id, { status: "closed" });
      setEnquiries((current) => current.map((entry) => entry.id === item.id ? result.data : entry));
    } catch (requestError) {
      setError(requestError.message || "Unable to update this enquiry.");
    }
  };

  const currentItems = activeTab === "Inbox" ? inbox : activeTab === "Certificate Requests" ? certificateRequests : enquiries;

  return (
    <div className="h-full w-full overflow-y-auto p-8">
      <div className="mb-2 flex items-center gap-4">
        <i className="ri-inbox-2-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Operations Inbox</h1>
      </div>
      <p className="mb-8 text-sm text-secondary">User-originated activity and requests awaiting administrator attention.</p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="mb-5 flex gap-2 border-b border-divider" role="tablist" aria-label="Operations queues">
        {tabs.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`border-b-2 px-4 py-3 text-sm ${activeTab === tab ? "border-[#00e676] text-primary" : "border-transparent text-secondary hover:text-primary"}`}>
            {tab}{tab === "Inbox" && unread > 0 ? ` (${unread})` : ""}
          </button>
        ))}
        <button type="button" onClick={loadData} className="ml-auto mb-2 self-center rounded border border-divider px-3 py-1.5 text-xs text-secondary hover:text-primary">Refresh</button>
      </div>

      <div className="divide-y divide-divider overflow-hidden rounded-lg border border-divider bg-surface">
        {currentItems.map((item) => (
          <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <h2 className="font-medium text-primary">{item.summary || item.name || item.title || item.email || item.userId || item.id}</h2>
              <p className="mt-1 text-xs text-secondary">{item.kind || item.status || "Request"} · {item.createdAt || item.requestedAt || ""}</p>
              {item.message && <p className="mt-2 max-w-3xl text-sm text-secondary">{item.message}</p>}
            </div>
            <div className="flex gap-2">
              {activeTab === "Inbox" && !item.ackAt && <button type="button" onClick={() => acknowledge(item)} className="rounded border border-divider px-3 py-1.5 text-xs text-primary hover:border-[#00e676]">Acknowledge</button>}
              {activeTab === "Certificate Requests" && item.status === "pending" && <button type="button" onClick={() => rejectCertificate(item)} className="rounded border border-red-500/40 px-3 py-1.5 text-xs text-red-300">Reject request</button>}
              {activeTab === "Enquiries" && item.status !== "closed" && <button type="button" onClick={() => closeEnquiry(item)} className="rounded border border-divider px-3 py-1.5 text-xs text-primary hover:border-[#00e676]">Close enquiry</button>}
            </div>
          </article>
        ))}
        {!currentItems.length && <p className="p-8 text-center text-sm text-secondary">No items in this queue.</p>}
      </div>
    </div>
  );
}
