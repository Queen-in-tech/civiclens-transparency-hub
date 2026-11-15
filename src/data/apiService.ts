
import axios from 'axios';

const API_BASE = 'https://n8n.arokolabs.com/webhook';
const INDICATORS_API = `${API_BASE}/civiclens/world-bank-indicators`;

export interface IndicatorObservation {
  id: number;
  source_id?: string;
  indicator_code: string;
  indicator_name: string;
  country_code: string;
  country_name: string;
  period: number;
  value: number | null;
  unit: string;
  source_url: string;
  fetched_at: string;
  source_last_updated: string | null;
  obs_status?: string | null;
}

export const apiService = {
  getDocuments: async () => {
    const response = await axios.get(`${API_BASE}/048d0a8e-dd84-44cf-824e-54d742a879b6`);
    // console.log(response)
     return response.data.map(doc => ({
      ...doc.fields,
      id: doc.id
    }));
  },

   getDocumentById: async (id: string) => {
    const response = await axios.get(`${API_BASE}/3d23ca6c-b0c1-4d33-b79c-c4d95844cd12?id=${id}`);
    return response.data
  },

  getIndicatorObservations: async (): Promise<IndicatorObservation[]> => {
    const response = await axios.get(INDICATORS_API);
    return response.data.map((row: { id: number; fields: Omit<IndicatorObservation, 'id'> }) => ({
      ...row.fields,
      id: row.id,
    }));
  },
};
