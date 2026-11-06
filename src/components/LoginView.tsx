import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUserFocused, setIsUserFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userInputRef = useRef<HTMLInputElement>(null);
  const passInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('يرجى إدخال اسم المستخدم وكلمة المرور | Please enter Username and Password');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) {
        setErrorMsg(result.error || 'بيانات الدخول غير صحيحة');
        setIsSubmitting(false);
      }
    }, 300);
  };

  const userActive = isUserFocused || username.length > 0;
  const passActive = isPassFocused || password.length > 0;

  return (
    <div
      dir="ltr"
      className="relative min-h-screen w-full overflow-x-hidden bg-[#F5F7FA] select-text flex flex-col lg:block font-['Cairo','Inter',sans-serif]"
    >
      {/* =====================================================================
          DESKTOP 4K FULL-BLEED BACKGROUND PLATE (100% Reference Match)
         ===================================================================== */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden select-none">
        <img
          src={`${import.meta.env.BASE_URL || '/'}assets/aistudio/login_clean_bg.png`}
          alt="قاعة الاجتماعات التنفيذية - ساعد للأنظمة المرورية"
          className="w-full h-full object-cover object-left"
        />
      </div>

      {/* =====================================================================
          MOBILE / TABLET HERO BANNER (visible below lg:)
         ===================================================================== */}
      <div className="lg:hidden relative w-full h-64 sm:h-80 overflow-hidden shrink-0 bg-[#123D70]">
        <img
          src={`${import.meta.env.BASE_URL || '/'}assets/aistudio/login_room_mobile.png`}
          alt="قاعة الاجتماعات التنفيذية"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#123D70]/80 via-[#123D70]/25 to-[#123D70]/90 pointer-events-none" />

        {/* Mobile Top Bar: Tagline on left, Brand on right */}
        <div className="absolute top-4 inset-x-4 flex items-start justify-between gap-3 z-10">
          <div className="flex items-stretch gap-2.5 text-left">
            <div className="w-[3px] rounded-full bg-[#C69A3A] shrink-0 my-0.5" />
            <div className="select-text">
              <p
                dir="rtl"
                className="text-white font-semibold text-sm sm:text-base leading-snug font-['Cairo'] drop-shadow-xs"
              >
                معاً .. لبيئة عمل أكثر كفاءة
              </p>
              <p
                dir="ltr"
                className="text-white/95 text-[10.5px] sm:text-xs font-normal font-['Inter'] leading-tight drop-shadow-xs"
              >
                Together .. For a More Efficient Work Environment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl shadow-md">
            <div className="text-right select-text">
              <div
                dir="rtl"
                className="text-[11px] sm:text-xs font-extrabold text-[#123D70] leading-tight font-['Cairo']"
              >
                ساعد للأنظمة المرورية
              </div>
              <div
                dir="ltr"
                className="text-[8px] sm:text-[9px] font-semibold text-[#123D70] tracking-[0.06em] font-['Inter']"
              >
                SAAED TRAFFIC SYSTEMS
              </div>
            </div>
            <img
              src={`${import.meta.env.BASE_URL || '/'}assets/aistudio/login_logo_icon.png`}
              alt="شعار ساعد للأنظمة المرورية"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 select-none"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          DESKTOP TOP-LEFT TAGLINE (معاً .. لبيئة عمل أكثر كفاءة)
         ===================================================================== */}
      <div className="hidden lg:flex absolute top-[5.8%] left-[4.35%] z-20 items-stretch gap-3.5 select-text">
        <div className="w-[3px] rounded-full bg-[#C69A3A] shrink-0 my-0.5" />
        <div className="flex flex-col justify-center text-left">
          <p
            dir="rtl"
            className="text-white font-semibold text-[21px] xl:text-[24px] leading-[1.3] font-['Cairo'] drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          >
            معاً .. لبيئة عمل أكثر كفاءة
          </p>
          <p
            dir="ltr"
            className="text-white/95 font-normal text-[12.5px] xl:text-[14px] leading-snug font-['Inter'] drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)] mt-0.5"
          >
            Together .. For a More Efficient Work Environment
          </p>
        </div>
      </div>

      {/* =====================================================================
          DESKTOP TOP-RIGHT CORPORATE LOGO & NAME
         ===================================================================== */}
      <div className="hidden lg:flex absolute top-[4.1%] right-[3.8%] z-20 items-center gap-3.5 select-text">
        <div className="text-right">
          <div
            dir="rtl"
            className="text-[19px] xl:text-[22px] font-extrabold text-[#123D70] leading-[1.2] font-['Cairo']"
          >
            ساعد للأنظمة المرورية
          </div>
          <div
            dir="ltr"
            className="text-[11px] xl:text-[12.5px] font-semibold text-[#123D70] tracking-[0.08em] font-['Inter'] uppercase mt-1"
          >
            SAAED TRAFFIC SYSTEMS
          </div>
        </div>
        <img
          src={`${import.meta.env.BASE_URL || '/'}assets/aistudio/login_logo_icon.png`}
          alt="ساعد للأنظمة المرورية - SAAED TRAFFIC SYSTEMS"
          className="w-[56px] h-[56px] xl:w-[66px] xl:h-[66px] object-contain shrink-0 select-none"
        />
      </div>

      {/* =====================================================================
          RIGHT PANEL: HEADER + WHITE LOGIN CARD
         ===================================================================== */}
      <div className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-0 lg:block lg:min-h-screen">
        <div className="w-full max-w-[490px] lg:max-w-none lg:w-[31.8%] lg:min-w-[420px] lg:max-w-[535px] lg:absolute lg:right-[7.5%] lg:top-[50%] lg:-translate-y-[48%] flex flex-col items-center">
          
          {/* Top Center Calendar + 3 People Emblem (Matches Reference 100%) */}
          <div className="mb-3 xl:mb-4 text-[#123D70] select-none">
            <svg
              viewBox="0 0 80 80"
              className="w-[66px] h-[66px] xl:w-[76px] xl:h-[76px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Top Calendar Rings */}
              <rect x="23" y="5" width="6" height="13" rx="3" stroke="#123D70" strokeWidth="2.8" fill="#F8FAFC" />
              <rect x="51" y="5" width="6" height="13" rx="3" stroke="#123D70" strokeWidth="2.8" fill="#F8FAFC" />

              {/* Outer Calendar Rounded Frame */}
              <rect
                x="10"
                y="11"
                width="60"
                height="61"
                rx="9"
                stroke="#123D70"
                strokeWidth="3"
              />

              {/* Calendar Header Divider Line */}
              <line x1="10" y1="24" x2="70" y2="24" stroke="#123D70" strokeWidth="2.8" />

              {/* Checkmark inside upper-left of calendar */}
              <path
                d="M21 33.5L25.5 38L34.5 29"
                stroke="#123D70"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Left Person */}
              <circle cx="25" cy="49" r="5" stroke="#123D70" strokeWidth="2.6" />
              <path
                d="M16.5 67V61.5C16.5 58.2 19.8 56 24.5 56C26.8 56 28.8 56.7 30.2 58"
                stroke="#123D70"
                strokeWidth="2.6"
                strokeLinecap="round"
              />

              {/* Right Person */}
              <circle cx="55" cy="49" r="5" stroke="#123D70" strokeWidth="2.6" />
              <path
                d="M63.5 67V61.5C63.5 58.2 60.2 56 55.5 56C53.2 56 51.2 56.7 49.8 58"
                stroke="#123D70"
                strokeWidth="2.6"
                strokeLinecap="round"
              />

              {/* Center Foreground Person */}
              <circle cx="40" cy="46.5" r="5.8" stroke="#123D70" strokeWidth="2.8" fill="#F8FAFC" />
              <path
                d="M29.5 71V62.5C29.5 58.4 33.8 55.5 40 55.5C46.2 55.5 50.5 58.4 50.5 62.5V71"
                stroke="#123D70"
                strokeWidth="2.8"
                fill="#F8FAFC"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Main System Title (Arabic & English - Selectable HTML Text) */}
          <h1
            dir="rtl"
            className="text-[26px] sm:text-[30px] xl:text-[34px] font-bold text-[#123D70] text-center leading-[1.25] font-['Cairo'] select-text"
          >
            نظام إدارة وحجز القاعات
          </h1>
          <p
            dir="ltr"
            className="text-[13.5px] sm:text-[15px] xl:text-[17px] font-medium text-[#15365F] text-center font-['Inter'] mt-1.5 mb-5 xl:mb-6 select-text"
          >
            Meeting Room Management &amp; Booking System
          </p>

          {/* =================================================================
              WHITE LOGIN CARD
             ================================================================= */}
          <div className="w-full bg-white rounded-[16px] shadow-[0_14px_45px_rgba(18,61,112,0.08)] border border-slate-100 px-6 py-7 sm:px-8 sm:py-8 xl:px-9 xl:py-9">
            <form onSubmit={handleSubmit} className="space-y-4 xl:space-y-5" noValidate>
              
              {/* Error Alert Banner */}
              {errorMsg && (
                <div
                  dir="rtl"
                  role="alert"
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-bold font-['Cairo'] select-text animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. USERNAME FIELD */}
              <div
                onClick={() => userInputRef.current?.focus()}
                className={`relative flex items-center w-full h-[60px] xl:h-[64px] rounded-[10px] bg-white border transition-all duration-200 cursor-text ${
                  isUserFocused
                    ? 'border-[#174A82] ring-2 ring-[#174A82]/15'
                    : 'border-[#CFD7E3] hover:border-[#94A3B8]'
                }`}
              >
                {/* Solid User Icon on the Left */}
                <div className="pl-5 pr-3.5 flex items-center justify-center shrink-0 select-none">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[20px] h-[20px] text-[#123D70]"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="7.5" r="4.2" />
                    <path d="M4.5 20.2c0-3.8 3.3-6.5 7.5-6.5s7.5 2.7 7.5 6.5v.8H4.5v-.8z" />
                  </svg>
                </div>

                {/* Selectable HTML Label (Matches Reference 100% when empty, floats to top when active) */}
                <label
                  htmlFor="login-username"
                  className={`absolute left-[56px] right-4 transition-all duration-150 flex flex-col items-start select-text cursor-text ${
                    userActive ? 'top-1.5' : 'top-1/2 -translate-y-1/2'
                  }`}
                >
                  <div
                    className={`flex ${
                      userActive ? 'flex-row items-center gap-1.5' : 'flex-col items-start'
                    }`}
                  >
                    <span
                      dir="rtl"
                      className={`font-['Cairo'] transition-all ${
                        userActive
                          ? 'text-[10.5px] font-bold text-[#174A82] leading-none'
                          : 'text-[13.5px] xl:text-[14.5px] font-semibold text-[#8895A7] leading-snug'
                      }`}
                    >
                      اسم المستخدم
                    </span>
                    {userActive && <span className="text-slate-300 text-[10px]">•</span>}
                    <span
                      dir="ltr"
                      className={`font-['Inter'] transition-all ${
                        userActive
                          ? 'text-[10px] font-medium text-[#64748B] leading-none'
                          : 'text-[12px] xl:text-[13px] font-normal text-[#8895A7] leading-tight'
                      }`}
                    >
                      Username
                    </span>
                  </div>
                </label>

                {/* Interactive Input */}
                <input
                  ref={userInputRef}
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onFocus={() => setIsUserFocused(true)}
                  onBlur={() => setIsUserFocused(false)}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  aria-label="اسم المستخدم Username"
                  className={`w-full h-full bg-transparent pl-1 pr-4 text-[#15365F] font-semibold text-sm xl:text-base focus:outline-hidden select-text ${
                    userActive ? 'pt-4' : 'opacity-0 focus:opacity-100'
                  }`}
                />
              </div>

              {/* 2. PASSWORD FIELD */}
              <div
                onClick={() => passInputRef.current?.focus()}
                className={`relative flex items-center w-full h-[60px] xl:h-[64px] rounded-[10px] bg-white border transition-all duration-200 cursor-text ${
                  isPassFocused
                    ? 'border-[#174A82] ring-2 ring-[#174A82]/15'
                    : 'border-[#CFD7E3] hover:border-[#94A3B8]'
                }`}
              >
                {/* Solid Padlock Icon with Keyhole on the Left */}
                <div className="pl-5 pr-3.5 flex items-center justify-center shrink-0 select-none">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[19px] h-[20px] text-[#123D70]"
                    fill="currentColor"
                  >
                    <path d="M17 9h-1V6.5C16 3.74 13.76 1.5 11 1.5S6 3.74 6 6.5V9H5c-1.1 0-2 .9-2 2v8.5c0 1.38 1.12 2.5 2.5 2.5h11c1.38 0 2.5-1.12 2.5-2.5V11c0-1.1-.9-2-2-2zM8.2 6.5c0-1.54 1.26-2.8 2.8-2.8s2.8 1.26 2.8 2.8V9H8.2V6.5zM12 16.2v2.1h-2v-2.1c-.6-.35-1-.98-1-1.7 0-1.1.9-2 2-2s2 .9 2 2c0 .72-.4 1.35-1 1.7z" />
                  </svg>
                </div>

                {/* Selectable HTML Label */}
                <label
                  htmlFor="login-password"
                  className={`absolute left-[56px] right-12 transition-all duration-150 flex flex-col items-start select-text cursor-text ${
                    passActive ? 'top-1.5' : 'top-1/2 -translate-y-1/2'
                  }`}
                >
                  <div
                    className={`flex ${
                      passActive ? 'flex-row items-center gap-1.5' : 'flex-col items-start'
                    }`}
                  >
                    <span
                      dir="rtl"
                      className={`font-['Cairo'] transition-all ${
                        passActive
                          ? 'text-[10.5px] font-bold text-[#174A82] leading-none'
                          : 'text-[13.5px] xl:text-[14.5px] font-semibold text-[#8895A7] leading-snug'
                      }`}
                    >
                      كلمة المرور
                    </span>
                    {passActive && <span className="text-slate-300 text-[10px]">•</span>}
                    <span
                      dir="ltr"
                      className={`font-['Inter'] transition-all ${
                        passActive
                          ? 'text-[10px] font-medium text-[#64748B] leading-none'
                          : 'text-[12px] xl:text-[13px] font-normal text-[#8895A7] leading-tight'
                      }`}
                    >
                      Password
                    </span>
                  </div>
                </label>

                {/* Interactive Password Input */}
                <input
                  ref={passInputRef}
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  aria-label="كلمة المرور Password"
                  className={`w-full h-full bg-transparent pl-1 pr-12 text-[#15365F] font-semibold text-sm xl:text-base focus:outline-hidden select-text ${
                    passActive ? 'pt-4' : 'opacity-0 focus:opacity-100'
                  }`}
                />

                {/* Show / Hide Password Eye Toggle on the Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassword((prev) => !prev);
                  }}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute right-3.5 p-1.5 rounded-lg text-[#8895A7] hover:text-[#123D70] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-[20px] h-[20px]" />
                  ) : (
                    <Eye className="w-[20px] h-[20px]" />
                  )}
                </button>
              </div>

              {/* 3. LOGIN SUBMIT BUTTON (دخول / Login) */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full h-[62px] xl:h-[66px] rounded-[10px] bg-[#123D70] hover:bg-[#174A82] text-white shadow-[0_6px_18px_rgba(18,61,112,0.22)] hover:shadow-[0_8px_24px_rgba(18,61,112,0.32)] transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.995]"
                >
                  <div className="flex flex-col items-center justify-center leading-tight select-text">
                    <span
                      dir="rtl"
                      className="text-[17px] xl:text-[19px] font-bold font-['Cairo']"
                    >
                      دخول
                    </span>
                    <span
                      dir="ltr"
                      className="text-[13px] xl:text-[14px] font-normal text-white/95 font-['Inter'] mt-0.5"
                    >
                      Login
                    </span>
                  </div>

                  {/* Outlined white circular arrow icon on the right (Matches Reference 100%) */}
                  <div className="absolute right-5 w-[32px] h-[32px] xl:w-[34px] xl:h-[34px] rounded-full border-[1.5px] border-white/85 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <ArrowRight className="w-4 h-4 stroke-[2]" />
                    )}
                  </div>
                </button>
              </div>

              {/* 4. SECURITY FOOTER BADGE (نظام آمن وموثوق / Secure & Reliable System) */}
              <div className="pt-3.5 xl:pt-4 flex items-center justify-center gap-2.5 select-text">
                {/* Outlined Shield with Checkmark Icon */}
                <svg
                  viewBox="0 0 24 26"
                  className="w-[21px] h-[23px] shrink-0 select-none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L3 5.8V12.5C3 18.4 6.8 23.7 12 25.2C17.2 23.7 21 18.4 21 12.5V5.8L12 2Z"
                    stroke="#123D70"
                    strokeWidth="1.9"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 13.2L11 15.7L15.8 10.5"
                    stroke="#123D70"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="text-center leading-tight">
                  <div
                    dir="rtl"
                    className="text-[12px] xl:text-[12.5px] font-bold text-[#4A5B70] font-['Cairo']"
                  >
                    نظام آمن وموثوق
                  </div>
                  <div
                    dir="ltr"
                    className="text-[10.5px] xl:text-[11px] font-normal text-[#8895A7] font-['Inter'] mt-0.5"
                  >
                    Secure &amp; Reliable System
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* =====================================================================
          BOTTOM-LEFT 3 FEATURES BAR (Matches exact position & alignment)
         ===================================================================== */}
      <div className="relative lg:absolute lg:bottom-[3.6%] lg:left-[4.4%] z-20 w-full lg:w-[46.5%] bg-[#123D70] lg:bg-transparent px-4 py-5 lg:p-0 border-t-2 border-[#C69A3A] lg:border-none mt-auto select-text">
        <div className="max-w-xl lg:max-w-none mx-auto grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center lg:justify-between gap-4 lg:gap-0">
          
          {/* Feature 1: Book Rooms Easily */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-9 h-9 xl:w-10 xl:h-10 flex items-center justify-center text-[#C69A3A] shrink-0 select-none">
              <svg viewBox="0 0 36 36" className="w-8 h-8 xl:w-9 xl:h-9" fill="none">
                <rect x="4" y="7" width="28" height="24" rx="3.5" stroke="#C69A3A" strokeWidth="1.8" />
                <line x1="4" y1="14" x2="32" y2="14" stroke="#C69A3A" strokeWidth="1.8" />
                <line x1="11" y1="4" x2="11" y2="9" stroke="#C69A3A" strokeWidth="2" strokeLinecap="round" />
                <line x1="25" y1="4" x2="25" y2="9" stroke="#C69A3A" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M13.5 22L16.8 25.2L23 19"
                  stroke="#C69A3A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-left">
              <div
                dir="rtl"
                className="text-white font-semibold text-[13.5px] xl:text-[14.5px] leading-snug font-['Cairo']"
              >
                حجز القاعات بسهولة
              </div>
              <div
                dir="ltr"
                className="text-white/90 text-[11px] xl:text-[11.5px] font-normal font-['Inter'] leading-tight mt-0.5"
              >
                Book Rooms Easily
              </div>
            </div>
          </div>

          {/* Vertical Divider 1 */}
          <div className="hidden lg:block h-8 w-px bg-white/25 shrink-0" />

          {/* Feature 2: Efficient Time Management */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-9 h-9 xl:w-10 xl:h-10 flex items-center justify-center text-[#C69A3A] shrink-0 select-none">
              <svg viewBox="0 0 36 36" className="w-8 h-8 xl:w-9 xl:h-9" fill="none">
                <circle cx="18" cy="18" r="13.5" stroke="#C69A3A" strokeWidth="1.8" />
                <line x1="18" y1="6.5" x2="18" y2="8.5" stroke="#C69A3A" strokeWidth="1.6" />
                <line x1="18" y1="27.5" x2="18" y2="29.5" stroke="#C69A3A" strokeWidth="1.6" />
                <line x1="6.5" y1="18" x2="8.5" y2="18" stroke="#C69A3A" strokeWidth="1.6" />
                <line x1="27.5" y1="18" x2="29.5" y2="18" stroke="#C69A3A" strokeWidth="1.6" />
                <path
                  d="M18 11V18L22.5 21"
                  stroke="#C69A3A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-left">
              <div
                dir="rtl"
                className="text-white font-semibold text-[13.5px] xl:text-[14.5px] leading-snug font-['Cairo']"
              >
                إدارة فعالة للوقت
              </div>
              <div
                dir="ltr"
                className="text-white/90 text-[11px] xl:text-[11.5px] font-normal font-['Inter'] leading-tight mt-0.5"
              >
                Efficient Time Management
              </div>
            </div>
          </div>

          {/* Vertical Divider 2 */}
          <div className="hidden lg:block h-8 w-px bg-white/25 shrink-0" />

          {/* Feature 3: Integrated Work Environment */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-9 h-9 xl:w-10 xl:h-10 flex items-center justify-center text-[#C69A3A] shrink-0 select-none">
              <svg viewBox="0 0 38 36" className="w-8 h-8 xl:w-9 xl:h-9" fill="none">
                <circle cx="19" cy="11.5" r="5" stroke="#C69A3A" strokeWidth="1.8" />
                <path
                  d="M9.5 29V24.5C9.5 20.8 13.5 18.5 19 18.5C24.5 18.5 28.5 20.8 28.5 24.5V29"
                  stroke="#C69A3A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M14.5 29V25.5M23.5 29V25.5"
                  stroke="#C69A3A"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M7 16.5C5.2 17.5 4 19.5 4 22V26.5M31 16.5C32.8 17.5 34 19.5 34 22V26.5"
                  stroke="#C69A3A"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="text-left">
              <div
                dir="rtl"
                className="text-white font-semibold text-[13.5px] xl:text-[14.5px] leading-snug font-['Cairo']"
              >
                بيئة عمل متكاملة
              </div>
              <div
                dir="ltr"
                className="text-white/90 text-[11px] xl:text-[11.5px] font-normal font-['Inter'] leading-tight mt-0.5"
              >
                Integrated Work Environment
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
