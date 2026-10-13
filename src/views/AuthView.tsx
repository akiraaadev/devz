import React, { useState } from 'react';
import {
  Radio,
  Lock,
  Mail,
  User,
  Store,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
  LogIn,
  UserPlus,
  HelpCircle
} from 'lucide-react';
import { UserRole } from '../types';

interface AuthViewProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    establishmentName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onRecoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  onLoginGoogle?: () => Promise<any>;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onRegister,
  onRecoverPassword,
  onLoginGoogle
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'recover'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('merchant');
  const [establishmentName, setEstablishmentName] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmail(demoEmail);
    setPassword(demoPass);
    const res = await onLogin(demoEmail, demoPass);
    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Falha ao autenticar.');
    }
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await onLogin(email, password);
    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'E-mail ou senha incorretos.');
    }
  };

  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (role === 'merchant' && !establishmentName.trim()) {
      setErrorMessage('Informe o nome do seu estabelecimento comercial.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await onRegister({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role,
      establishmentName: establishmentName.trim()
    });

    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Não foi possível criar sua conta.');
    }
  };

  const handleSubmitRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Digite seu e-mail cadastrado.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    const res = await onRecoverPassword(email.trim());
    setIsLoading(false);
    setSuccessMessage(res.message);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#182235] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7137E8] to-[#00B8A9] text-white flex items-center justify-center mx-auto shadow-md mb-3">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#182235]">
            Meu Pix NFC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Plataforma de Pagamentos Pix para Plaquinhas NFC Comerciais
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="mb-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Acesso Rápido para Testes:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@meupixnfc.com.br', 'admin123')}
              className="py-2 px-2.5 bg-[#F2ECFD] hover:bg-[#e4d7fc] text-[#7137E8] rounded-xl text-left text-xs font-semibold transition-colors flex items-center justify-between"
            >
              <div>
                <span className="block font-bold">Administrador</span>
                <span className="text-[10px] text-purple-600 block">Gestão Global</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#7137E8] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('carlos@farmaciadocarro.com.br', 'cliente123')}
              className="py-2 px-2.5 bg-[#E6F8F6] hover:bg-[#d1f3ef] text-[#008479] rounded-xl text-left text-xs font-semibold transition-colors flex items-center justify-between"
            >
              <div>
                <span className="block font-bold">Cliente / Loja</span>
                <span className="text-[10px] text-[#008479] block">Farmácia do Carro</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#008479] shrink-0" />
            </button>
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 mb-6 gap-2">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-xs font-bold transition-colors relative flex-1 text-center ${
                tab === 'login'
                  ? 'text-[#00B8A9] border-b-2 border-[#00B8A9]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-xs font-bold transition-colors relative flex-1 text-center ${
                tab === 'register'
                  ? 'text-[#00B8A9] border-b-2 border-[#00B8A9]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Criar Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('recover');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-xs font-bold transition-colors relative flex-1 text-center ${
                tab === 'recover'
                  ? 'text-[#00B8A9] border-b-2 border-[#00B8A9]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Recuperar
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setTab('recover')}
                    className="text-[11px] text-[#7137E8] hover:underline font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#00B8A9] hover:bg-[#009E91] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  'Entrando...'
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Entrar na Plataforma
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleSubmitRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Carlos Alberto Silva"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seuemail@comercio.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha (mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Escolha de Papel */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('merchant')}
                    className={`py-2 px-3 rounded-xl border text-left text-xs transition-colors ${
                      role === 'merchant'
                        ? 'border-[#00B8A9] bg-[#E6F8F6] text-[#008479] font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Cliente / Lojista</span>
                    <span className="text-[10px] text-slate-500 font-normal">Meu Estabelecimento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-xl border text-left text-xs transition-colors ${
                      role === 'admin'
                        ? 'border-[#7137E8] bg-[#F2ECFD] text-[#7137E8] font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Administrador</span>
                    <span className="text-[10px] text-slate-500 font-normal">Gestão Global</span>
                  </button>
                </div>
              </div>

              {/* Se for Cliente/Lojista, solicita nome do estabelecimento */}
              {role === 'merchant' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Estabelecimento Comercial *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={establishmentName}
                      onChange={e => setEstablishmentName(e.target.value)}
                      placeholder="Ex: Farmácia do Carro ou Barbearia"
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#7137E8] hover:bg-[#6025D8] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  'Cadastrando...'
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Criar Conta e Acessar
                  </>
                )}
              </button>
            </form>
          )}

          {/* RECOVER PASSWORD FORM */}
          {tab === 'recover' && (
            <form onSubmit={handleSubmitRecover} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Informe o seu e-mail cadastrado para receber as instruções de recuperação de acesso.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Voltar ao Login
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-[#00B8A9] hover:bg-[#009E91] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Link'}
                </button>
              </div>
            </form>
          )}

          {/* Google Auth Divider */}
          {onLoginGoogle && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={onLoginGoogle}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continuar com Google
              </button>
            </div>
          )}
        </div>

        {/* Security footer */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Autenticação criptografada com Firebase Auth e isolamento de dados por perfil
        </p>
      </div>
    </div>
  );
};
