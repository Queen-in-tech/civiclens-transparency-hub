
import axios from 'axios';

const API_BASE = 'https://sheba-n8n.duckdns.org/webhook/048d0a8e-dd84-44cf-824e-54d742a879b6';

export const apiService = {
  getDocuments: async () => {
    const response = await axios.get(`${API_BASE}`);
    return response.data;
  },

   getDocumentById: async (id: string) => {
    const response = await axios.get(`https://sheba-n8n.duckdns.org/webhook/3d23ca6c-b0c1-4d33-b79c-c4d95844cd12?id=${id}`);
    return response.data;
  },
};
