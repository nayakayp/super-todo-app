import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore, User } from '../stores/authStore';

type AuthResponse = { user: User };

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<AuthResponse>('/auth/me');
      setUser(response.user);
      return response;
    },
    retry: false,
    enabled: !user,
  });

  const signUpMutation = useMutation({
    mutationFn: (data: { email: string; password: string; name?: string }) =>
      api.post<AuthResponse>('/auth/sign-up', data),
    onSuccess: (response) => {
      setUser(response.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const signInMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/sign-in', data),
    onSuccess: (response) => {
      setUser(response.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: () => api.post<{ success: boolean }>('/auth/sign-out'),
    onSuccess: () => {
      clearUser();
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp: signUpMutation.mutateAsync,
    signIn: signInMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  };
}
