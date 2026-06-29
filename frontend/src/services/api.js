import axios from "axios";

// Base URL for FastAPI backend
const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Resumes ---
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/resumes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadResumesBatch = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return api.post("/resumes/upload-batch", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getCandidates = () => api.get("/resumes/");
export const getCandidateById = (id) => api.get(`/resumes/${id}`);
export const deleteCandidate = (id) => api.delete(`/resumes/${id}`);

// --- Jobs ---
export const uploadJobText = (title, description) =>
  api.post("/jobs/upload-text", { title, description });

export const getJobs = () => api.get("/jobs/");
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

// --- Matching ---
export const scoreCandidate = (candidateId, jobId) =>
  api.post(`/matching/score/${candidateId}/${jobId}`);

export const scoreAllCandidates = (jobId) =>
  api.post(`/matching/score-all/${jobId}`);

export const getRanking = (jobId) => api.get(`/matching/ranking/${jobId}`);

export const getMatchDetails = (candidateId, jobId) =>
  api.get(`/matching/details/${candidateId}/${jobId}`);
export const getExportUrl = (jobId) => `${API_BASE_URL}/matching/export/${jobId}`;

export const getSkillGap = (candidateId, jobId) =>
  api.get(`/matching/skill-gap/${candidateId}/${jobId}`);

export const getInterviewQuestions = (candidateId, jobId) =>
  api.get(`/matching/interview-questions/${candidateId}/${jobId}`);

export const getInsights = () => api.get("/matching/insights");

export default api;