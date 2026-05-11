import API from "./api";

export const createPreApprovedInvite = async (payload) => {
  const res = await API.post("/pre-approved-invites", payload);
  return res.data;
};

export const getMyPreApprovedInvites = async () => {
  const res = await API.get("/pre-approved-invites/my");
  return res.data;
};

export const getPreApprovedInviteById = async (id) => {
  const res = await API.get(`/pre-approved-invites/${id}`);
  return res.data;
};

export const updatePreApprovedInvite = async (id, payload) => {
  const res = await API.put(`/pre-approved-invites/${id}`, payload);
  return res.data;
};

export const cancelPreApprovedInvite = async (id) => {
  const res = await API.patch(`/pre-approved-invites/${id}/cancel`);
  return res.data;
};

// Guard
export const searchGateInvite = async ({ society_id, mobile, pass_code, qr_code } = {}) => {
  const res = await API.get("/gate/pre-approved-invites/search", {
    params: { society_id, mobile, pass_code, qr_code },
  });
  return res.data;
};

export const gateInviteCheckIn = async (id, payload) => {
  const res = await API.post(`/gate/pre-approved-invites/${id}/check-in`, payload);
  return res.data;
};

export const gateInviteCheckOut = async (id, payload) => {
  const res = await API.post(`/gate/pre-approved-invites/${id}/check-out`, payload);
  return res.data;
};

export const gateInviteDeny = async (id, payload) => {
  const res = await API.post(`/gate/pre-approved-invites/${id}/deny`, payload);
  return res.data;
};

// Admin
export const adminListInvites = async (params = {}) => {
  const res = await API.get("/admin/pre-approved-invites", { params });
  return res.data;
};

export const adminGateEntryLogs = async (params = {}) => {
  const res = await API.get("/admin/gate-entry-logs", { params });
  return res.data;
};

