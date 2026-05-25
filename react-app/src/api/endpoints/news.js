import apiClient from '../client';

export const getNews = async (params = {}) => {
  const { data } = await apiClient.get('/news', { params });
  return data;
};

export const getArticle = async (slug) => {
  const { data } = await apiClient.get(`/news/${slug}`);
  return data;
};
