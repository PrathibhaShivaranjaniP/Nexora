import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCcw, ArrowRight, ShieldCheck, User, Globe } from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { realDistrictsData } from '../../data/realDistrictsData';

export const LoginScreen = () => {
  const { language, setLanguage, setIsAuthenticated, setUserRole } = useHospitalStore();
  const [step, setStep] = useState(1);
  
  // Step 2 States
  const [hospitalName, setHospitalName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(code);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Find if the entered hospital name exists
    let foundHospital = false;
    for (const district of Object.values(realDistrictsData)) {
      if (district.hospitals.some(h => 
        h.shortName.toLowerCase() === hospitalName.trim().toLowerCase() || 
        h.name.toLowerCase() === hospitalName.trim().toLowerCase() || 
        h.id.toLowerCase() === hospitalName.trim().toLowerCase()
      )) {
        foundHospital = true;
        break;
      }
    }

    // Default test fallback
    if (hospitalName === 'Central City Hospital') foundHospital = true;

    if (!foundHospital || password !== 'Admin@123') {
      setErrorMsg(language === 'ta' ? 'தவறான மருத்துவமனை பெயர் அல்லது கடவுச்சொல்.' : 'Invalid hospital name or password. Please use a valid hospital name from the district list.');
      return;
    }
    
    if (captchaInput.toUpperCase() !== captchaText) {
      setErrorMsg(language === 'ta' ? 'கேப்ட்சா தவறானது.' : 'Incorrect CAPTCHA.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }
    
    if (!isRobotChecked) {
      setErrorMsg(language === 'ta' ? 'ரோபோ இல்லை என்பதை உறுதிப்படுத்தவும்.' : 'Please confirm you are not a robot.');
      return;
    }
    
    setUserRole('authority');
    setIsAuthenticated(true);
  };

  // Translations
  const t = {
    hospitalAdmin: language === 'ta' ? 'மருத்துவமனை நிர்வாகி' : 'Hospital Admin',
    hospitalAdminDesc: language === 'ta' ? 'மருத்துவமனை நிர்வாகியாக உள்நுழைக' : 'Login as Hospital Administrator',
    hospitalStaff: language === 'ta' ? 'மருத்துவமனை ஊழியர்கள்' : 'Hospital Staff',
    hospitalStaffDesc: language === 'ta' ? 'மருத்துவமனை ஊழியராக உள்நுழைக' : 'Login as Hospital Staff',
    citizenPatient: language === 'ta' ? 'பொதுமக்கள் / நோயாளி' : 'Citizen / Patient',
    citizenPatientDesc: language === 'ta' ? 'பொது போர்ட்டலை அணுகவும்' : 'Access the public emergency portal',
    selectRole: language === 'ta' ? 'உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்' : 'Select Your Role',
    adminLoginTitle: language === 'ta' ? 'மருத்துவமனை நிர்வாகி உள்நுழைவு' : 'Hospital Admin Login',
    adminLoginSubtitle: language === 'ta' ? 'உங்கள் மருத்துவமனை திறன் கட்டளை மையத்திற்கு பாதுகாப்பான அணுகல்.' : 'Secure access to your hospital capacity command center.',
    hospitalNameLabel: language === 'ta' ? 'மருத்துவமனை பெயர்' : 'Hospital Name',
    hospitalNamePlaceholder: language === 'ta' ? 'மருத்துவமனை பெயரை உள்ளிடவும்' : 'Enter hospital name',
    passwordLabel: language === 'ta' ? 'மருத்துவமனை கடவுச்சொல்' : 'Hospital Password',
    passwordPlaceholder: language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter hospital password',
    captchaLabel: language === 'ta' ? 'கேப்ட்சாவை உள்ளிடவும்' : 'Enter CAPTCHA',
    notRobot: language === 'ta' ? 'நான் ஒரு ரோபோ இல்லை' : 'I\'m not a robot',
    loginBtn: language === 'ta' ? 'கட்டளை மையத்திற்குள் நுழையவும் →' : 'LOGIN TO COMMAND CENTER →',
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#020610] flex flex-col items-center justify-center p-4 text-white relative">
        <div className="absolute top-6 right-6 flex items-center space-x-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800 backdrop-blur">
          <Globe className="w-5 h-5 text-cyan-400" />
          <button 
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage('ta')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'ta' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            TA
          </button>
        </div>

        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2">{t.selectRole}</h1>
          <p className="text-slate-400 text-center mb-12">Secure Gateway to AegisOS</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              onClick={() => setStep(2)}
              className="bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 p-8 rounded-2xl cursor-pointer group transition-all backdrop-blur hover:bg-slate-800/60"
            >
              <div className="w-16 h-16 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 group-hover:text-cyan-400 transition-colors">{t.hospitalAdmin}</h2>
              <p className="text-slate-400">{t.hospitalAdminDesc}</p>
            </div>

            <div 
              onClick={() => {
                setUserRole('patient');
                setIsAuthenticated(true);
              }}
              className="bg-slate-900/40 border border-slate-800 hover:border-purple-500/50 p-8 rounded-2xl cursor-pointer group transition-all backdrop-blur hover:bg-slate-800/60"
            >
              <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">{t.citizenPatient}</h2>
              <p className="text-slate-400">{t.citizenPatientDesc}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020610] text-white flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row bg-slate-900/30 rounded-3xl border border-slate-800 backdrop-blur overflow-hidden shadow-2xl min-h-[600px]">
        
        {/* Left Side Form (45%) */}
        <div className="w-full lg:w-[45%] p-8 lg:p-12 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            type="button"
            onClick={() => setStep(1)}
            className="text-slate-400 hover:text-white flex items-center mb-8 text-sm transition-colors w-fit"
          >
            ← Back to Roles
          </button>
          
          <h2 className="text-3xl font-bold mb-2">{t.adminLoginTitle}</h2>
          <p className="text-slate-400 mb-8">{t.adminLoginSubtitle}</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t.hospitalNameLabel}</label>
              <select 
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none"
              >
                <option value="">{t.hospitalNamePlaceholder}</option>
                {Object.values(realDistrictsData).map(district => (
                  <optgroup key={district.id} label={district.name}>
                    {district.hospitals.map(h => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t.passwordLabel}</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all pr-12"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-cyan-400">Demo Password: <strong className="font-mono bg-slate-800 px-1 rounded">Admin@123</strong></p>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">CAPTCHA Verification</label>
              <div className="flex gap-4 items-center">
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-6 py-3 flex items-center justify-center relative overflow-hidden select-none min-w-[120px]">
                  <span className="font-mono text-xl font-bold tracking-widest text-cyan-400 transform -skew-x-12">{captchaText}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"></div>
                </div>
                <button 
                  type="button"
                  onClick={generateCaptcha}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors focus:outline-none"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
                <input 
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  placeholder={t.captchaLabel}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 uppercase min-w-0"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input 
                type="checkbox"
                id="robot"
                checked={isRobotChecked}
                onChange={(e) => setIsRobotChecked(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
              />
              <label htmlFor="robot" className="text-slate-300 select-none cursor-pointer">
                {t.notRobot}
              </label>
            </div>

            {errorMsg && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
                {errorMsg}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-4 rounded-lg flex items-center justify-center transition-colors mt-4"
            >
              {t.loginBtn}
            </button>
          </form>
        </div>

        {/* Right Side Visual (55%) */}
        <div className="hidden lg:flex lg:w-[55%] bg-slate-950 p-12 flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 w-full max-w-lg mx-auto">
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
              Smarter Hospital Capacity.<br />
              <span className="text-cyan-400">Better Decisions.</span>
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              AI-powered forecasting and real-time capacity intelligence for modern hospitals.
            </p>
            
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl mb-12 backdrop-blur">
              <p className="text-slate-300 leading-relaxed text-lg">
                🎯 Our Aim: To help hospitals anticipate capacity shortages before they happen and make faster, data-driven operational decisions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-12">
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl hover:border-cyan-500/30 transition-colors">
                <div className="text-3xl mb-3">🔮</div>
                <h3 className="font-semibold text-lg mb-1">Predict</h3>
                <p className="text-sm text-slate-400">Forecast bed demand hours ahead.</p>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl hover:border-cyan-500/30 transition-colors">
                <div className="text-3xl mb-3">🛏️</div>
                <h3 className="font-semibold text-lg mb-1">Optimize</h3>
                <p className="text-sm text-slate-400">Maximize bed utilization and flow.</p>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/30 transition-colors">
                <div className="text-3xl mb-3">⚠️</div>
                <h3 className="font-semibold text-lg mb-1">Prevent</h3>
                <p className="text-sm text-slate-400">Stop bottlenecks before they occur.</p>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/30 transition-colors">
                <div className="text-3xl mb-3">🌐</div>
                <h3 className="font-semibold text-lg mb-1">Coordinate</h3>
                <p className="text-sm text-slate-400">Align staff and resources seamlessly.</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-700 p-4 rounded-xl text-xs xl:text-sm font-semibold shadow-lg shadow-cyan-900/20 w-full overflow-hidden">
              <span className="text-slate-300 flex items-center whitespace-nowrap">🏥 <span className="hidden xl:inline ml-1">Hospital</span> Data</span>
              <ArrowRight className="w-3 h-3 xl:w-4 xl:h-4 text-slate-500 mx-1 flex-shrink-0" />
              <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] whitespace-nowrap">🤖 AI ENGINE</span>
              <ArrowRight className="w-3 h-3 xl:w-4 xl:h-4 text-slate-500 mx-1 flex-shrink-0" />
              <span className="text-emerald-400 whitespace-nowrap">📊 FORECAST</span>
              <ArrowRight className="w-3 h-3 xl:w-4 xl:h-4 text-slate-500 mx-1 flex-shrink-0" />
              <span className="text-amber-400 whitespace-nowrap">⚠️ RISK ALERT</span>
              <ArrowRight className="w-3 h-3 xl:w-4 xl:h-4 text-slate-500 mx-1 flex-shrink-0" />
              <span className="text-white whitespace-nowrap">✅ SMART ACTION</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
