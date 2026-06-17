import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserPlus, Loader2, AlertCircle, ChevronLeft, Building2, User, Trophy } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import apiClient from '../../api/client';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
  sportId: z.string().min(1, 'Please select a sport'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
});

const RegisterTeamPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { data: sports } = useQuery({
    queryKey: ['sports-list-register'],
    queryFn: getSports,
  });

  const { register, handleSubmit, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const nextStep = async () => {
    const fields = step === 1 ? ['fullName', 'username', 'email', 'password', 'phone'] : [];
    const isValid = await trigger(fields);
    if (isValid) setStep(2);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/team/register', data);
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 bg-green rounded-full flex items-center justify-center animate-bounce shadow-2xl shadow-green/20">
          <Trophy size={48} className="text-white" />
        </div>
        <div className="space-y-4">