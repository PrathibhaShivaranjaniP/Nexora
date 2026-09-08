import React, { useState, useEffect } from 'react';
import { useHospitalStore } from './store/hospitalStore';
import { DistrictVectorMap } from './components/ThreeDView/DistrictVectorMap';
import { Hospital3DCanvas } from './components/ThreeDView/Hospital3DCanvas';
import { EmergencyRoutePage } from './components/modules/EmergencyRoutePage';
import { WhatIfSandbox } from './components/modules/WhatIfSandbox';
import { AdmitPatientModal } from './components/modals/AdmitPatientModal';
import { BedDetailModal } from './components/modals/BedDetailModal';
import { AIAssistantModal } from './components/AIAssistant/AIAssistantModal';
import { SitrepExportModal } from './components/modals/SitrepExportModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { DisasterSimulatorModal } from './components/modals/DisasterSimulatorModal';
import { BedReservationModal } from './components/modals/BedReservationModal';
import { EmergencySimulationModal } from './components/modals/EmergencySimulationModal';
import { TacticalCommsModal } from './components/modals/TacticalCommsModal';
import { HospitalOxygenBankModal } from './components/modules/HospitalOxygenBankModal';
import { HospitalBloodBankModal } from './components/modules/HospitalBloodBankModal';
import { GpsStreamModal } from './components/modules/GpsStreamModal';
import { PatientPublicPortal } from './components/modules/PatientPublicPortal';
import WelcomeOverlay from './components/layout/WelcomeOverlay';
import LiveKPIStrip from './components/layout/LiveKPIStrip';
import { LoginScreen } from './components/auth/LoginScreen';
import { AnalyticsDashboard } from './components/modules/AnalyticsDashboard';
import { MobileGlanceDashboard } from './components/layout/MobileGlanceDashboard';
import { Sidebar } from './components/layout/Sidebar';
import { OmniSearchModal } from './components/modals/OmniSearchModal';
import { AIShiftHandoverModal } from './components/modals/AIShiftHandoverModal';
import { AIInsightsPanel } from './components/modules/AIInsightsPanel';
import { PredictiveTimeScrubber } from './components/modules/PredictiveTimeScrubber';
import { CCTVFeedPanel } from './components/modules/CCTVFeedPanel';
import { QRScannerModal } from './components/modals/QRScannerModal';
import { sound } from './utils/audioEngine';

export const App: React.FC = () => {
  const {
    spatialTier,
    setSpatialTier,
    dedicatedRouteActive,
    setDedicatedRouteActive,
    isOxygenModalOpen,
    isBloodModalOpen,
    isGpsStreamModalOpen,
    openOxygenModal,
    openBloodModal,
    openGpsStreamModal,
    userRole,
    isAuthenticated,
    isOmniSearchOpen,
    setOmniSearchOpen,
    isShiftHandoverOpen,
    setShiftHandoverOpen,
    t
  } = useHospitalStore();

  const [activeModuleView, setActiveModuleView] = useState<
    'spatial' | 'what-if' | 'ai-insights' | 'analytics'
  >('spatial');

  // Mobile detection
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showMobileGlance, setShowMobileGlance] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modals state
  const [isAdmitOpen, setIsAdmitOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSitrepOpen, setIsSitrepOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDisasterOpen, setIsDisasterOpen] = useState(false);
  const [isEmergencySimOpen, setIsEmergencySimOpen] = useState(false);
  const [isCommsOpen, setIsCommsOpen] = useState(false);
  const [commsTargetId, setCommsTargetId] = useState<string | undefined>(undefined);
  const [showWelcome, setShowWelcome] = useState(true);

  // Global Ctrl+K / Cmd+K Keyboard Shortcut for Omnibox Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sound.playTactileClick();
        if (setOmniSearchOpen) setOmniSearchOpen(!isOmniSearchOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOmniSearchOpen, setOmniSearchOpen]);

  // Show Handover Modal once for admin on login
  useEffect(() => {
    if (isAuthenticated && userRole === 'authority' && setShiftHandoverOpen) {
      // Check if already shown in this session
      const hasShown = sessionStorage.getItem('handover-shown');
      if (!hasShown) {
        setShiftHandoverOpen(true);
        sessionStorage.setItem('handover-shown', 'true');
      }
    }
  }, [isAuthenticated, userRole, setShiftHandoverOpen]);

  // Handle Sidebar Navigation
  const handleSidebarNavigate = (view: string) => {
    if (view === 'district') {
      setActiveModuleView('spatial');
      setDedicatedRouteActive(false);
      setSpatialTier(2); // Tier 2: District
    } else if (view === 'hospital') {
      setActiveModuleView('spatial');
      setDedicatedRouteActive(false);
      setSpatialTier(3); // Tier 3: Hospital
    } else if (view === 'route-navigator') {
      setActiveModuleView('spatial');
      setDedicatedRouteActive(true); // 108 Emergency Route
    } else if (view === 'analytics' || view === 'ai-insights' || view === 'what-if') {
      setActiveModuleView(view as any);
      setDedicatedRouteActive(false);
    }
  };

  const getSidebarActiveView = () => {
    if (dedicatedRouteActive) return 'route-navigator';
    if (activeModuleView !== 'spatial') return activeModuleView;
    if (spatialTier === 2) return 'district';
    return 'hospital';
  };

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#050811] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* LEFT SIDEBAR (Doctor/Admin Only) */}
      {userRole === 'authority' && (
        <Sidebar
          activeView={getSidebarActiveView()}
          onNavigate={handleSidebarNavigate}
          onOpenSearch={() => setOmniSearchOpen && setOmniSearchOpen(true)}
          onOpenVoice={() => setIsAssistantOpen(true)}
          onOpenDisasterSim={() => setIsDisasterOpen(true)}
          onLogout={() => { window.location.reload(); }}
        />
      )}

      {/* Main Command Theater Stage */}
      <main className="flex-1 w-full h-full p-3 sm:p-4 overflow-y-auto space-y-4">
        {userRole === 'patient' ? (
          <PatientPublicPortal />
        ) : isMobile && showMobileGlance ? (
          <div className="relative w-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-[#040711] animate-in fade-in zoom-in-95 duration-200">
            <MobileGlanceDashboard />
          </div>
        ) : activeModuleView === 'analytics' ? (
          <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-[#040711] animate-in fade-in zoom-in-95 duration-200">
            <AnalyticsDashboard />
          </div>
        ) : activeModuleView === 'ai-insights' ? (
          <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-[#040711] animate-in fade-in zoom-in-95 duration-200">
            <AIInsightsPanel />
          </div>
        ) : activeModuleView === 'what-if' ? (
          <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-[#040711] animate-in fade-in zoom-in-95 duration-200">
            <WhatIfSandbox />
          </div>
        ) : (
          <div className="flex flex-col h-full gap-2.5">
            {/* Live Executive KPI Strip - Doctor/Authority Only */}
            <LiveKPIStrip />

            {/* SPATIAL HIERARCHY FULL-BLEED 3D STAGE & EMERGENCY ROUTE THEATER */}
            <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-[#040711] animate-in fade-in zoom-in-95 duration-200">
              {dedicatedRouteActive ? (
                <EmergencyRoutePage
                  onBackToDistrict={() => {
                    setDedicatedRouteActive(false);
                    setSpatialTier(2);
                  }}
                  onEnterWard={() => {
                    setDedicatedRouteActive(false);
                    setSpatialTier(3);
                  }}
                  onOpenComms={(targetId) => {
                    setCommsTargetId(targetId);
                    setIsCommsOpen(true);
                  }}
                />
              ) : (
                <>
                  {/* TIER 2: District Map */}
                  {spatialTier === 2 && (
                    <DistrictVectorMap
                      onOpenComms={(targetId) => {
                        setCommsTargetId(targetId);
                        setIsCommsOpen(true);
                      }}
                    />
                  )}

                  {/* TIER 3: Hospital 3D Canvas */}
                  {(spatialTier === 3 || spatialTier === 4) && (
                    <Hospital3DCanvas
                      onOpenComms={(targetId) => {
                        setCommsTargetId(targetId);
                        setIsCommsOpen(true);
                      }}
                      onOpenOxygen={() => openOxygenModal(true)}
                      onOpenBlood={() => openBloodModal(true)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Modals */}
      <AdmitPatientModal isOpen={isAdmitOpen} onClose={() => setIsAdmitOpen(false)} />
      <BedDetailModal />
      <BedReservationModal />
      <AIAssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      <SitrepExportModal isOpen={isSitrepOpen} onClose={() => setIsSitrepOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <DisasterSimulatorModal isOpen={isDisasterOpen} onClose={() => setIsDisasterOpen(false)} />
      <EmergencySimulationModal isOpen={isEmergencySimOpen} onClose={() => setIsEmergencySimOpen(false)} />
      
      {isCommsOpen && commsTargetId && (
        <TacticalCommsModal
          isOpen={isCommsOpen}
          onClose={() => {
            setIsCommsOpen(false);
            setCommsTargetId(undefined);
          }}
        />
      )}

      {isOmniSearchOpen && setOmniSearchOpen && (
        <OmniSearchModal isOpen={isOmniSearchOpen} onClose={() => setOmniSearchOpen(false)} />
      )}

      {isShiftHandoverOpen && setShiftHandoverOpen && (
        <AIShiftHandoverModal isOpen={isShiftHandoverOpen} onClose={() => setShiftHandoverOpen(false)} />
      )}

      <HospitalOxygenBankModal
        isOpen={isOxygenModalOpen || false}
        onClose={() => openOxygenModal && openOxygenModal(false)}
      />
      
      <HospitalBloodBankModal
        isOpen={isBloodModalOpen || false}
        onClose={() => openBloodModal && openBloodModal(false)}
      />

      <GpsStreamModal
        isOpen={isGpsStreamModalOpen || false}
        onClose={() => openGpsStreamModal && openGpsStreamModal(false)}
      />

      {/* Outstanding Features */}
      {userRole === 'authority' && activeModuleView === 'spatial' && <PredictiveTimeScrubber />}
      <CCTVFeedPanel />
      <QRScannerModal />

      {/* First-Launch Welcome Overlay */}
      {showWelcome && <WelcomeOverlay onDismiss={() => setShowWelcome(false)} />}
    </div>
  );
};
