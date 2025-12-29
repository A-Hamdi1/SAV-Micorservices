import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authApi, ChangePasswordDto } from '../../api/auth';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { toast } from 'react-toastify';

interface ApiErrorResponse {
  message: string;
  errors?: string[];
}

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordDto>();

  const newPassword = watch('newPassword');

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Mot de passe changé avec succès');
      reset();
      setTimeout(() => {
        navigate('/client/dashboard');
      }, 2000);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors du changement de mot de passe';
      toast.error(errorMessage);
    },
  });

  const onSubmit = async (data: ChangePasswordDto) => {
    await changePasswordMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Changer le mot de passe"
        subtitle="Mettez à jour votre mot de passe pour sécuriser votre compte"
        breadcrumb={[
          { label: 'Dashboard', path: '/client/dashboard' },
          { label: 'Changer le mot de passe' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="flex flex-col items-center py-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">Sécurité</h3>
              <p className="text-sm text-bodydark2 text-center">
                Changez régulièrement votre mot de passe pour maintenir votre compte sécurisé.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Form Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Formulaire de changement de mot de passe" />
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="form-label">
                    Mot de passe actuel <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('currentPassword', {
                        required: 'Le mot de passe actuel est requis',
                        minLength: {
                          value: 8,
                          message: 'Le mot de passe doit contenir au moins 8 caractères',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="form-input pr-10"
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bodydark2 hover:text-primary transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <ErrorMessage message={errors.currentPassword.message || ''} />
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="form-label">
                    Nouveau mot de passe <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('newPassword', {
                        required: 'Le nouveau mot de passe est requis',
                        minLength: {
                          value: 8,
                          message: 'Le mot de passe doit contenir au moins 8 caractères',
                        },
                        validate: {
                          hasUpperCase: (value) =>
                            /[A-Z]/.test(value) || 'Doit contenir au moins une lettre majuscule',
                          hasLowerCase: (value) =>
                            /[a-z]/.test(value) || 'Doit contenir au moins une lettre minuscule',
                          hasNumber: (value) =>
                            /[0-9]/.test(value) || 'Doit contenir au moins un chiffre',
                        },
                      })}
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input pr-10"
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bodydark2 hover:text-primary transition-colors"
                    >
                      {showNewPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <ErrorMessage message={errors.newPassword.message || ''} />
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmer le nouveau mot de passe <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'Veuillez confirmer votre mot de passe',
                        validate: (value) =>
                          value === newPassword ||
                          'Les mots de passe ne correspondent pas',
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input pr-10"
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bodydark2 hover:text-primary transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <ErrorMessage message={errors.confirmPassword.message || ''} />
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Exigences du mot de passe :</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <span className={`text-lg ${newPassword && /[A-Z]/.test(newPassword) ? 'text-success' : 'text-bodydark2'}`}>✓</span>
                      Au moins une lettre majuscule
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`text-lg ${newPassword && /[a-z]/.test(newPassword) ? 'text-success' : 'text-bodydark2'}`}>✓</span>
                      Au moins une lettre minuscule
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`text-lg ${newPassword && /[0-9]/.test(newPassword) ? 'text-success' : 'text-bodydark2'}`}>✓</span>
                      Au moins un chiffre
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`text-lg ${newPassword && newPassword.length >= 8 ? 'text-success' : 'text-bodydark2'}`}>✓</span>
                      Au moins 8 caractères
                    </li>
                  </ul>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/client/dashboard')}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={changePasswordMutation.isPending}
                  >
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
