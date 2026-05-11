import API from "./api";

export const getVisitorTypes = async () => {
  const res = await API.get("/visitor-types");
  return res.data;
};

export const resolveResidentForUnit = async (unitId) => {
  const res = await API.get("/visitor-entries/resolve-resident", {
    params: { unit_id: unitId },
  });
  return res.data;
};

export const createVisitorEntry = async (payload) => {
  const res = await API.post("/visitor-entries", payload);
  return res.data;
};

export const getGuardVisitorEntries = async ({ societyId } = {}) => {
  const res = await API.get("/guard/visitor-entries", {
    params: societyId ? { society_id: societyId } : undefined,
  });
  return res.data;
};

export const checkInVisitorEntry = async (id) => {
  const res = await API.patch(`/visitor-entries/${id}/check-in`);
  return res.data;
};

export const checkOutVisitorEntry = async (id) => {
  const res = await API.patch(`/visitor-entries/${id}/check-out`);
  return res.data;
};

export const getResidentVisitorRequests = async ({ residentUserId } = {}) => {
  const res = await API.get("/resident/visitor-requests", {
    params: residentUserId ? { user_id: residentUserId } : undefined,
    headers: residentUserId ? { "x-user-id": residentUserId } : undefined,
  });
  return res.data;
};

export const approveVisitorEntry = async (id, { residentUserId } = {}) => {
  const res = await API.patch(
    `/visitor-entries/${id}/approve`,
    {},
    {
      headers: residentUserId ? { "x-user-id": residentUserId } : undefined,
      params: residentUserId ? { user_id: residentUserId } : undefined,
    }
  );
  return res.data;
};

export const rejectVisitorEntry = async (
  id,
  { residentUserId, rejectionReason }
) => {
  const res = await API.patch(
    `/visitor-entries/${id}/reject`,
    { rejection_reason: rejectionReason },
    {
      headers: residentUserId ? { "x-user-id": residentUserId } : undefined,
      params: residentUserId ? { user_id: residentUserId } : undefined,
    }
  );
  return res.data;
};
