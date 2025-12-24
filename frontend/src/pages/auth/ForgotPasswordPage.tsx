import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi, ForgotPasswordDto } from '../../api/auth';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

type Step = 'email' | 'otp' | 'password';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<ForgotPasswordDto>();

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: errorsOtp },
  } = useForm<{ otp: string }>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    watch,
  } = useForm<{ newPassword: string; confirmPassword: string }>();

  const newPassword = watch('newPassword');

  // Step 1: Request OTP
  const onSubmitEmail = async (data: ForgotPasswordDto) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data);
      setEmail(data.email);
      setStep('otp');
      toast.success('Un code de vérification a été envoyé à votre email');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const onSubmitOtp = async (data: { otp: string }) => {
    setIsLoading(true);
    try {
      await authApi.verifyOtp({ email, otp: data.otp });
      setOtp(data.otp);
      setStep('password');
      toast.success('Code vérifié avec succès');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Code invalide ou expiré');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const onSubmitPassword = async (data: { newPassword: string; confirmPassword: string }) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email,
        otp,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success('Mot de passe réinitialisé avec succès');
      navigate('/login');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          step === 'email' ? 'bg-primary-600 text-white' : 'bg-success text-white'
        }`}>
          {step === 'email' ? '1' : '✓'}
        </div>
        <div className={`w-16 h-1 ${step !== 'email' ? 'bg-success' : 'bg-gray-300'}`} />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          step === 'otp' ? 'bg-primary-600 text-white' : step === 'password' ? 'bg-success text-white' : 'bg-gray-300 text-gray-500'
        }`}>
          {step === 'password' ? '✓' : '2'}
        </div>
        <div className={`w-16 h-1 ${step === 'password' ? 'bg-success' : 'bg-gray-300'}`} />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          step === 'password' ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-500'
        }`}>
          3
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Réinitialisation</h1>
              <p className="text-primary-200 text-lg">Récupérez l'accès à votre compte</p>
            </div>
            
            <div className="space-y-4 mt-12">
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <span>Entrez votre adresse email</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <span>Recevez un code de vérification</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <span>Créez un nouveau mot de passe</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-600 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black">Mot de passe oublié</h1>
          </div>

          {renderStepIndicator()}

          {/* Step 1: Email Form */}
          {step === 'email' && (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-black mb-2">Mot de passe oublié ?</h2>
                <p className="text-bodydark2">Entrez votre email pour recevoir un code de vérification</p>
              </div>

              <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-6">
                <div>
                  <label htmlFor="email" className="form-label">
                    Adresse email
                  </label>
                  <div className="relative">
                    <input
                      {...registerEmail('email', {
                        required: 'Email requis',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email invalide',
                        },
                      })}
                      type="email"
                      placeholder="exemple@email.com"
                      className="form-input pl-12"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bodydark2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                  {errorsEmail.email && (
                    <p className="mt-2 text-sm text-danger">{errorsEmail.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full h-12 text-base disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi en cours...
                    </span>
                  ) : (
                    'Envoyer le code'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP Form */}
          {step === 'otp' && (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-black mb-2">Vérification</h2>
                <p className="text-bodydark2">
                  Entrez le code à 6 chiffres envoyé à<br />
                  <span className="font-medium text-black">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmitOtp(onSubmitOtp)} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="form-label">
                    Code de vérification
                  </label>
                  <div className="relative">
                    <input
                      {...registerOtp('otp', {
                        required: 'Code requis',
                        pattern: {
                          value: /^[0-9]{6}$/,
                          message: 'Le code doit contenir 6 chiffres',
                        },
                      })}
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      className="form-input text-center text-2xl tracking-[0.5em] font-mono"
                    />
                  </div>
                  {errorsOtp.otp && (
                    <p className="mt-2 text-sm text-danger">{errorsOtp.otp.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full h-12 text-base disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Vérification...
                    </span>
                  ) : (
                    'Vérifier le code'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSubmitEmail({ email })}
                  disabled={isLoading}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700"
                >
                  Renvoyer le code
                </button>
              </form>
            </>
          )}

          {/* Step 3: New Password Form */}
          {step === 'password' && (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-black mb-2">Nouveau mot de passe</h2>
                <p className="text-bodydark2">Créez un nouveau mot de passe sécurisé</p>
              </div>

              {/* Password Requirements */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">Le mot de passe doit contenir :</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Au moins 8 caractères
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Au moins une majuscule (A-Z)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Au moins une minuscule (a-z)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Au moins un chiffre (0-9)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Au moins un caractère spécial (!@#$%^&*)
                  </li>
                </ul>
              </div>

              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                <div>
                  <label htmlFor="newPassword" className="form-label">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('newPassword', {
                        required: 'Mot de passe requis',
                        minLength: {
                          value: 8,
                          message: 'Le mot de passe doit contenir au moins 8 caractères',
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial',
                        },
                      })}
                      type="password"
                      placeholder="************"
                      className="form-input pl-12"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bodydark2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                  </div>
                  {errorsPassword.newPassword && (
                    <p className="mt-2 text-sm text-danger">{errorsPassword.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('confirmPassword', {
                        required: 'Confirmation requise',
                        validate: (value) =>
                          value === newPassword || 'Les mots de passe ne correspondent pas',
                      })}
                      type="password"
                      placeholder="************"
                      className="form-input pl-12"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bodydark2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                  </div>
                  {errorsPassword.confirmPassword && (
                    <p className="mt-2 text-sm text-danger">{errorsPassword.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full h-12 text-base disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Réinitialisation...
                    </span>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
