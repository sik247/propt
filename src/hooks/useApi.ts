import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService, Instruction, CritiqueIssue } from '@/lib/api';

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.healthCheck(),
    retry: 1,
  });
};

export const useExtractInstructions = () => {
  return useMutation({
    mutationFn: (prompt: string) => apiService.extractInstructions(prompt),
    onError: (error) => {
      console.error('Error extracting instructions:', error);
    },
  });
};

export const useCritiquePrompt = () => {
  return useMutation({
    mutationFn: (prompt: string) => apiService.critiquePrompt(prompt),
    onError: (error) => {
      console.error('Error critiquing prompt:', error);
    },
  });
};

export const useRevisePrompt = () => {
  return useMutation({
    mutationFn: (prompt: string) => apiService.revisePrompt(prompt),
    onError: (error) => {
      console.error('Error revising prompt:', error);
    },
  });
};