import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000', // 수정된 백엔드 API URL
});

export const getBoards = async () => {
  const response = await api.get('/boards');
  return response.data;
};

export const createBoard = async (board) => {
  const response = await api.post('/boards', board);
  return response.data;
};
