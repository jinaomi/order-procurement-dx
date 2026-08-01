const getAll = (axiosPrivate, name, pageSize = 25, pageNumber = 1) => {
  let url = `/api/supplier/getAll?pageSize=${pageSize}&pageNumber=${pageNumber}`;
  if (name) {
    url += `&name=${name}`;
  }
  return axiosPrivate.get(url);
};

const list = (axiosPrivate) => {
  return axiosPrivate.get("/api/supplier/list");
};

const getById = (axiosPrivate, id) => {
  return axiosPrivate.get(`/api/supplier?id=${id}`);
};

const create = (axiosPrivate, data) => {
  return axiosPrivate.post("/api/supplier", data);
};

const update = (axiosPrivate, id, data) => {
  return axiosPrivate.put(`/api/supplier/${id}`, data);
};

const deleteById = (axiosPrivate, id) => {
  return axiosPrivate.delete(`/api/supplier/${id}`);
};

const supplierService = { getAll, list, getById, create, update, deleteById };

export default supplierService;
