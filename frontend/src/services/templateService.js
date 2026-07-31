const getAll = (axiosPrivate, pageSize = 25, pageNumber = 1) => {
  return axiosPrivate.get(`/api/template/getAll?pageSize=${pageSize}&pageNumber=${pageNumber}`);
};

const getById = (axiosPrivate, templateId) => {
  return axiosPrivate.get(`/api/template?templateId=${templateId}`);
};

const getModuleTemplate = (axiosPrivate, moduleType) => {
  return axiosPrivate.get(`/api/template/module?moduleType=${moduleType}`);
};

const create = (axiosPrivate, data) => {
  return axiosPrivate.post("/api/template", data);
};

const deleteById = (axiosPrivate, id) => {
  return axiosPrivate.delete(`/api/template/${id}`);
};

const templateService = { getAll, getById, getModuleTemplate, create, deleteById };

export default templateService;
