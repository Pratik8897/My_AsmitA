import api from "./api";

export const getSystemLogs = async ({ lines = 200, date } = {}) => {
  const params = { lines };
  if (date) params.date = date;
  const res = await api.get("/system-logs", { params });
  return res.data;
};

export const getAuditLogs = async ({
  user_id,
  module,
  action,
  status,
  from,
  to,
  limit = 200,
  offset = 0,
} = {}) => {
  const params = {
    user_id,
    module,
    action,
    status,
    from,
    to,
    limit,
    offset,
  };

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined || params[key] === null || params[key] === "") {
      delete params[key];
    }
  });

  const res = await api.get("/audit-logs", { params });
  return res.data;
};
